import { Marlin, StepperConfig } from "./marlin";
import { CoordinateSet } from "./cnc";
import { MillimetersPerSecond, Millimeters } from "./units";

export interface InvertParams {
  x: boolean;
  y: boolean;
  z: boolean;
  e: boolean;
}

export const StepperConfigs: StepperConfig[] = [
  {
    axis: "X",
    port: 0,
    name: "Stage (X)",
    steps: 400,
    max: {
      jerk: 10,
      acceleration: 200,
      feedrate: 100,
    },
  },
  {
    axis: "Y",
    port: 1,
    name: "Stage (Y)",
    steps: 400, // 100 -> 1/4 turn for 0.9 degree steppers
    max: {
      jerk: 10,
      acceleration: 200,
      feedrate: 100,
    },
  },
  {
    axis: "Z",
    port: 2,
    name: "Focus Control (Z)",
    steps: 10,
    max: {
      jerk: 1,
      acceleration: 20,
      feedrate: 40,
    },
  },
  {
    axis: "E",
    port: 4,
    name: "Turret Control",
    steps: 50, // 50 -> 1/4 turn for 1.8 degree steppers
    max: {
      jerk: 10,
      acceleration: 200,
      feedrate: 100,
    },
  },
];

export class Scope extends Marlin {
  // Max overall speed, even during boost
  private maxSpeed: MillimetersPerSecond = 200;
  // Largest travel allowed in a single operation
  private maxMove: Millimeters =
    this.maxSpeed / Math.floor(this.commandRate / 4);
  // Axes to invert control of
  private invert: InvertParams = {
    x: false,
    y: false,
    z: false,
    e: false,
  };

  async setup(stepperConfigs: StepperConfig[]): Promise<void> {
    // Disable movement during setup
    await this.setFeedrate(0);

    await this.setTravelUnit();
    await this.setInactivityShutdown(300);
    await this.setTemperatureInterval(20);
    await this.setPositionInterval(5);
    await this.relativeMode();

    // TODO Adjust global limits
    await this.setMinFeedrate(0.001);
    await this.setMaxFeedrate(200);
    await this.setMaxAcceleration(500);
    await this.setMaxJerk(10);

    for (const config of stepperConfigs) {
      await this.configureStepper(config);
    }

    await this.setFeedrate(1);
  }

  async jingle(): Promise<void> {
    await this.tone(50, 450);
    await this.tone(100, 600);
  }

  async shutdown(): Promise<void> {
    await this.disableSteppers();
  }

  // Returns 1 or -1 according to invert settings
  axisModifier(axis: keyof InvertParams): -1 | 1 {
    return this.invert[axis] ? -1 : 1;
  }

  limitTravel({ x, y, z, e }: CoordinateSet): CoordinateSet {
    return {
      x: this.axisModifier("x") * Math.min(x, this.maxMove),
      y: this.axisModifier("y") * Math.min(y, this.maxMove),
      z: this.axisModifier("z") * Math.min(z, this.maxMove),
      e: this.axisModifier("e") * Math.min(e, this.maxMove),
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
}
