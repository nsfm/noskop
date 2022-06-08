import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { Scope, StepperConfigs } from "./scope";
import { Multiplier, Hertz, Millimeters, MillimetersPerSecond } from "./units";

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

class Noskop {
  // Boost intensity
  private boostPower: Multiplier = 80;
  // Frequency of movement evaluation (travel ticks)
  private moveRate: Hertz = 15;
  // Amount per travel tick to move the Z axis
  private focusStep: Millimeters = 0.01;

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

  /**
   * Return a feedrate multiplier using the trigger states.
   * Left trigger applies a linear boost up to this.maxBoost
   * Right trigger applies a linear brake to the overall speed
   */
  get boost(): Multiplier {
    const {
      left: { trigger: l2 },
      right: { trigger: r2 },
    } = this.controller;
    return (1 - r2.state) * lerp(1, this.maxBoost, l2.state);
  }

  /**
   * Maximum feedrate multiplier.
   * Adjusts boost range/precision.
   */
  get maxBoost(): Multiplier {
    const { circle, square } = this.controller;
    return this.boostPower / (circle.state ? 0.5 : square.state ? 2 : 1);
  }

  /**
   * Unboosted feedrate. Also needs to change with magnification.
   */
  get baseFeedrate(): MillimetersPerSecond {
    return 10;
  }

  /**
   * Checks active inputs to produce a suitable travel.
   */
  async checkMove(): Promise<void> {
    if (this.scope.busy()) return;
    const {
      dpad: { left, right },
      left: { analog, bumper: l1 },
      right: { bumper: r1 },
    } = this.controller;

    if (
      analog.magnitude > 0.075 ||
      l1.state ||
      r1.state ||
      left.state ||
      right.state
    ) {
      // TODO stop checking the state. Just skip short travels,
      return this.scope.travel(
        {
          x: analog.x.state / 2,
          y: analog.y.state / 2,
          z: this.focusStep * (l1.state ? -1 : r1.state ? 1 : 0),
          e: this.focusStep * (left.state ? -1 : right.state ? 1 : 0),
        },
        this.baseFeedrate * this.boost
      );
    }
  }

  // Assigns other controller actions
  bindControls() {
    const {
      scope,
      controller: { ps, triangle, cross, circle, square, mute },
    } = this;

    ps.on("press", async () => {
      await scope.shutdown();
      process.exit(0);
    });

    cross.on("press", async () => {
      const res = await scope.getEndstopStates();
      this.log.info(`Endstops: ${res.response || "err"}`);
    });

    triangle.on("press", async () => {
      this.log.info(`Running travel calibration`);
      const results = await scope.calibrate();
      for (const res of results) {
        this.log.info(res);
      }
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
