import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { CoordinateSet } from "./cnc";
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
   * Unboosted feedrate. TODO needs to change with magnification.
   */
  get baseFeedrate(): MillimetersPerSecond {
    return 10;
  }

  /**
   * Checks active inputs to produce a suitable travel.
   */
  async checkMove(followUp: boolean = false): Promise<void> {
    if (!followUp && this.scope.busy()) return;

    const {
      dpad: { left, right },
      left: { analog, bumper: l1 },
      right: { bumper: r1 },
    } = this.controller;

    const coordinates: CoordinateSet = {
      x: analog.x.state * 5,
      y: analog.y.state * 5,
      z: this.focusStep * (l1.state ? -1 : r1.state ? 1 : 0),
      e: this.focusStep * (left.state ? -1 : right.state ? 1 : 0),
    };

    const { x, y, z, e } = coordinates;
    if (x + y + z + e < 0.00025) return;

    return this.scope.travel(coordinates, this.baseFeedrate * this.boost);
  }
}
