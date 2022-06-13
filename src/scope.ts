import { Stage, StageParams } from "./stage";
import { Marlin } from "./marlin";
import { CoordinateSet, CNCParams } from "./cnc";
import { MillimetersPerSecond, Millimeters, Milliseconds } from "./units";

export interface ScopeParams extends CNCParams {
  stage?: StageParams;
}

interface CalibrationResult {
  distance: Millimeters;
  feedrate: MillimetersPerSecond;
  duration: Milliseconds;
}

/**
 * Coordinates various mechanics of a microscope.
 */
export class Scope extends Marlin {
  // Max overall speed, even during boost
  private maxSpeed: MillimetersPerSecond = 1000;
  // Largest travel allowed in a single operation
  private maxMove: Millimeters =
    this.maxSpeed / Math.floor(this.commandRate / 4);

  public readonly stage: Stage;

  constructor(params: ScopeParams = {}) {
    super(params);
    this.log = this.log.child({ module: "Scope" });

    this.stage = new Stage(params.stage || {});
  }

  async jingle(): Promise<void> {
    await this.tone(50, 450);
    await this.tone(100, 600);
  }

  async shutdown(): Promise<void> {
    await this.disableSteppers();
  }

  limitTravel({ x, y, z, e }: CoordinateSet): CoordinateSet {
    return {
      x: Math.min(x, this.maxMove),
      y: Math.min(y, this.maxMove),
      z: Math.min(z, this.maxMove),
      e: Math.min(e, this.maxMove),
    };
  }

  private moving: boolean = false;

  /**
   * A safe, pleasant linear move
   */
  async travel(
    coordinates: CoordinateSet,
    feedrate: MillimetersPerSecond
  ): Promise<void> {
    if (this.moving) return;

    try {
      this.moving = true;
      const setMode = this.relativeMode();
      const move = this.linearMove(this.limitTravel(coordinates), feedrate);
      await setMode;
      await move;
      await this.finish();
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
}
