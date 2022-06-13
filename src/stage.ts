import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { Scope } from "./scope";
import { Multiplier, Hertz, Millimeters, MillimetersPerSecond } from "./units";
import { lerp } from "./math";

export interface StageParams {
  // Frequency of movement evaluation (travel ticks per second)
  moveRate?: Hertz;
  // The logger to extend
  logger?: Logger;
  // The microscope to control
  scope?: Scope;
  // The controller to listen to
  controller?: Dualsense;
}

/**
 * Stage manages travel on the X, Y and Z axis for a connected Scope.
 */
export class Stage {
  // Boost intensity
  public boostPower: Multiplier = 80;
  // Amount per travel tick to move the Z axis
  public focusStep: Millimeters = 0.01;

  private readonly moveRate: Hertz = 15;
  private readonly log: Logger;
  private readonly controller: Dualsense;
  private readonly scope: Scope;

  constructor(params: StageParams = {}) {
    this.moveRate = params.moveRate || 15;
    this.log =
      params.logger?.child({ module: "Stage" }) ||
      Logger.createLogger({
        name: "Stage",
        level: "debug",
      });
    this.controller = params.controller || new Dualsense();
    this.scope = params.scope || new Scope();

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
          x: analog.x.state * 5,
          y: analog.y.state * 5,
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
