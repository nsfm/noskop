import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { Scope, StepperConfigs } from "./scope";
import { Multiplier, Hertz } from "./units";

class Noskop {
  // Maximum boost multiplier
  private maxBoost: Multiplier = 60;
  // Frequency of movement evaluation
  private moveRate: Hertz = 15;

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
    await this.scope.setup(StepperConfigs);
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

  /**
   * Checks active inputs to produce a suitable travel.
   */
  async checkMove(): Promise<void> {
    if (this.scope.busy()) return;
    const {
      dpad,
      left: { analog },
    } = this.controller;

    if (dpad.active) {
      return this.scope.travel(
        {
          x: 0,
          y: 0,
          e:
            (dpad.left.state ? -this.scope.axisModifier("x") : 0) +
            (dpad.right.state ? this.scope.axisModifier("x") : 0),
          z:
            (dpad.up.state ? this.scope.axisModifier("y") : 0) +
            (dpad.down.state ? -this.scope.axisModifier("y") : 0),
        },
        10
      );
    }

    if (analog.active && analog.magnitude > 0.075) {
      return this.scope.travel(
        { x: analog.x.state, y: analog.y.state, z: 0, e: 0 },
        this.boost * 5 + 10
      );
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
