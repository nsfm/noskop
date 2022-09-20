import { Service } from "typedi";

import { LogService, Logger } from "./";
import { CoordinateSet, Marlin } from "../cnc";
import { MillimetersPerSecond, Millimeters, Milliseconds } from "../units";
import { distance } from "../math";

export interface CalibrationResult {
  distance: Millimeters;
  feedrate: MillimetersPerSecond;
  duration: Milliseconds;
}

export interface ScopeState {
  maxSpeed: MillimetersPerSecond;
  maxMove: Millimeters;
  moving: boolean;
}

/**
 * Coordinates various mechanics of the microscope.
 */
@Service()
export class ScopeService {
  // Hardware interface
  public readonly scope: Marlin;

  // Max overall speed, even during boost
  private maxSpeed: MillimetersPerSecond = 1000;
  // True while travels are active
  private moving: boolean = false;

  private log: Logger;

  constructor(logger: LogService) {
    this.log = logger.spawn("scope");
    this.scope = new Marlin({ logger: this.log });
  }

  async jingle(): Promise<void> {
    await this.scope.tone(50, 450);
    await this.scope.tone(100, 600);
  }

  async shutdown(): Promise<void> {
    await this.scope.disableSteppers();
  }

  /**
   * Returns a new CoordinateSet with a limited travel distance
   */
  limitTravel({ x, y, z, e }: CoordinateSet): CoordinateSet {
    return {
      x: Math.min(x, this.maxMove),
      y: Math.min(y, this.maxMove),
      z: Math.min(z, this.maxMove),
      e: Math.min(e, this.maxMove),
    };
  }

  /**
   * Returns the largest travel allowed in a single operation.
   */
  get maxMove(): Millimeters {
    return this.maxSpeed / Math.floor(this.scope.commandRate / 4);
  }

  /**
   * Returns true if we think the scope is executing a travel right now.
   */
  get travelling(): boolean {
    return this.moving;
  }

  /**
   * Returns an estimate for the amount of time the proposed travel should take.
   */
  travelDuration(
    feedrate: MillimetersPerSecond,
    ...coordinates: Millimeters[]
  ): Milliseconds {
    return (distance(...coordinates) / feedrate) * 1000;
  }

  /**
   * A safe, pleasant linear move
   */
  async travel(
    coordinates: CoordinateSet,
    feedrate: MillimetersPerSecond,
    waitForTravel: boolean = true
  ): Promise<void> {
    if (this.moving) return;

    try {
      this.moving = true;
      const setMode = this.scope.relativeMode();
      const move = this.scope.linearMove(
        this.limitTravel(coordinates),
        feedrate
      );
      await setMode;
      await move;

      if (!waitForTravel) {
        return Promise.resolve();
      }

      await this.scope.finish();
    } finally {
      this.moving = false;
    }
  }

  /**
   * Determine how long different kinds of movements take.
   * We need this information to know when to send travel commands;
   * An input should be as fresh as possible, and reach the board
   * just before any active movement enters the decel phase.
   */
  async calibrate(): Promise<CalibrationResult[]> {
    const calibrations: CalibrationResult[] = [];

    for (const distance of [0.001, 0.01, 0.1, 1.0]) {
      for (const feedrate of [0.1, 1, 10, 100]) {
        const start = Date.now();
        for (const direction of [-1, 1, -1, 1, -1, 1]) {
          await this.travel(
            { x: direction * distance, y: 0, z: 0, e: 0 },
            feedrate
          );
        }
        calibrations.push({
          distance,
          feedrate,
          duration: (Date.now() - start) / 4,
        });
      }
    }

    return calibrations;
  }

  /**
   * The current UX state of the component.
   */
  get state(): ScopeState {
    return {
      maxSpeed: this.maxSpeed,
      maxMove: this.maxMove,
      moving: this.moving,
    };
  }
}
