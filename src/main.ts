import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { Scope } from "./scope";

type Millimeters = number;
type Multiplier = number;
type Hertz = number;
type MillimetersPerSecond = number;

export interface InvertParams {
  x: boolean;
  y: boolean;
  z: boolean;
  e: boolean;
}

class Noskop {
  // Frequency of movement evaluation
  private moveRate: Hertz = 15;
  // Max overall speed, even during boost
  private maxSpeed: MillimetersPerSecond = 200;
  // Maximum boost multiplier
  private maxBoost: Multiplier = 60;
  // Largest travel allowed in a single operation
  private maxMove: Millimeters = this.maxSpeed / this.moveRate;
  // Axes to invert control of
  private invert: InvertParams = {
    x: false,
    y: false,
    z: false,
    e: false,
  };

  private log = Logger.createLogger({
    level: "debug",
    name: "noskop",
  });

  public scope: Scope = new Scope({
    logger: this.log,
    debug: !!process.env.DEBUG,
    commandRate: this.moveRate * 4,
  });

  public controller: Dualsense = new Dualsense();

  async setup(): Promise<void> {
    await this.scope.setup();
    this.bindControls();
    setInterval(() => {
      this.checkMove()
        .then(() => {
          // Should time the moves
        })
        .catch((err) => {
          this.log.error(err);
        });
    }, 1000 / this.moveRate);
    this.log.info("Setup complete");
  }

  // Returns 1 or -1 according to invert settings
  private axisModifier(axis: keyof InvertParams): -1 | 1 {
    return this.invert[axis] ? -1 : 1;
  }

  // Returns a feedrate multiplier for movements
  get boost(): number {
    const {
      circle,
      square,
      left: { trigger },
    } = this.controller;
    if (square.state) return Math.abs(trigger.state - 1);
    if (circle.state) return trigger.state * this.maxBoost;
    return 1;
  }

  private moving: boolean = false;
  async travel(x: Millimeters, y: Millimeters): Promise<void> {
    if (this.moving) return;

    try {
      this.moving = true;
      const X = this.axisModifier("x") * Math.min(x, this.maxMove);
      const Y = this.axisModifier("y") * Math.min(y, this.maxMove);
      const setMode = this.scope.relativeMode();
      const move = this.scope.linearMove(
        { x: X, y: Y, z: 0, e: 0 },
        this.boost * 5 + 10
      );
      await setMode;
      await move;
      await this.scope.finish();
    } finally {
      this.moving = false;
    }
  }

  // Triggers movements using analog and dpad states
  async checkMove(): Promise<void> {
    if (this.scope.busy()) return;

    const { dpad } = this.controller;
    if (dpad.active) {
      return this.travel(
        (dpad.left.state ? -this.axisModifier("x") : 0) +
          (dpad.right.state ? this.axisModifier("x") : 0),
        (dpad.up.state ? this.axisModifier("y") : 0) +
          (dpad.down.state ? -this.axisModifier("y") : 0)
      );
    }

    const { analog } = this.controller.left;
    if (analog.active && analog.magnitude > 0.075) {
      return this.travel(analog.x.state, analog.y.state);
    }
  }

  // Assigns other controller actions
  bindControls() {
    const {
      scope,
      controller: { ps, triangle, circle, square, mute },
    } = this;

    ps.on("press", async () => {
      await scope.shutdown();
      process.exit(0);
    });

    triangle.on("press", async () => {
      const res = await scope.getEndstopStates();
      this.log.info(`Endstops: ${res.response || "err"}`);
    });

    // When the light turns on/off, turn steppers off/on
    mute.status.on("change", async () => {
      await scope.setSteppers(!mute.status.state);
    });

    circle.on("change", ({ state }) => {
      if (!square.state) this.log.info(`Boost ${state ? "on" : "off"}`);
    });

    square.on("change", ({ state }) => {
      this.log.info(
        `Poost ${state ? "on" : "off"}${circle.state ? " (boost off)" : ""}`
      );
    });
  }
}

async function main() {
  const noskop = new Noskop();
  await noskop.setup();
}

await main();
