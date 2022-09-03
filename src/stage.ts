import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { CoordinateSet } from "./cnc";
import { Scope } from "./scope";
import { Multiplier, Hertz, Millimeters, MillimetersPerSecond } from "./units";
import { lerp } from "./math";

export interface StagePosition {
  x: Millimeters;
  y: Millimeters;
  z: Millimeters;
}

export type StageLimits = StagePosition;

/**
 * Configures a mechanical stage that moves on the X, Y, and Z axes.
 */
export interface StageParams {
  // Frequency of movement evaluation (travel ticks per second)
  moveRate?: Hertz;
  // The logger to extend
  logger?: Logger;
  // The microscope to control
  scope?: Scope;
  // The controller to listen to
  controller?: Dualsense;
  // Boundaries to enforce in software
  limits?: StageLimits;
}

/**
 * UX state for this component.
 */
export interface StageState {
  boostPower: Multiplier;
  travelPower: Multiplier;
  focusStep: Millimeters;
  homed: boolean;
  moveRate: Hertz;
  position: StagePosition;
  targetPosition: StagePosition;
  limits: StageLimits;
}

/**
 * Stage manages travel on the X, Y and Z axis for a connected Scope.
 */
export class Stage {
  // Boost intensity
  public boostPower: Multiplier = 80;
  // Increases max distance travelled in a single step
  public travelPower: Multiplier = 5;
  // Amount per travel tick to move the Z axis
  public focusStep: Millimeters = 0.01;
  // True when the stage understands its position
  public homed: boolean = false;
  // Current position of the stage; relative if this.homed is false
  public position: StagePosition = { x: 0, y: 0, z: 0 };
  // Position we are currently moving to; relative if this.homed is false
  public targetPosition: StagePosition = { x: 0, y: 0, z: 0 };
  // When this.homed is true, restrict travel beyond these limits
  public readonly limits: StageLimits;
  // Check inputs this many times per second
  public readonly moveRate: Hertz;

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
    this.limits = params.limits || { x: 75, y: 75, z: 75 };

    setInterval(() => {
      if (!this.scope.travelling) {
        this.move()
          .then()
          .catch((err) => {
            this.log.error(err);
          });
      }
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
   * Unboosted feedrate.
   * TODO Should change with magnification.
   */
  get baseFeedrate(): MillimetersPerSecond {
    return 10;
  }

  /**
   * Amount of time to wait before scheduling follow-up travels.
   */
  get travelOverlap(): Multiplier {
    return 0.75;
  }

  /**
   * Ignore travels smaller than this threshold.
   * TODO Should change with magnification.
   */
  get moveThreshold(): Millimeters {
    return 0.00025;
  }

  updateTarget({ x, y, z }: StagePosition): void {
    this.position = this.targetPosition;
    if (this.homed) {
      this.targetPosition = { x, y, z };
    } else {
      this.targetPosition.x += x;
      this.targetPosition.y += y;
      this.targetPosition.z += z;
    }
  }

  /**
   * Checks active inputs to produce a suitable travel.
   * Schedules the next travel to begin before this one ends.
   */
  async move(followUp: boolean = false): Promise<void> {
    if (!followUp && this.scope.busy()) return;

    const {
      dpad: { left, right },
      left: { analog, bumper: l1 },
      right: { bumper: r1 },
    } = this.controller;

    const coordinates: CoordinateSet = {
      x: analog.x.force * this.travelPower,
      y: analog.y.force * this.travelPower,
      z: this.focusStep * (l1.state ? -1 : r1.state ? 1 : 0),
      e: this.focusStep * (left.state ? -1 : right.state ? 1 : 0),
    };

    const { x, y, z, e } = coordinates;
    if (Math.abs(x + y + z + e) < this.moveThreshold) return;

    const feedrate = this.baseFeedrate * this.boost;
    const duration = this.scope.travelDuration(feedrate, x, y, z);
    const nextTravelDelay = Math.round(lerp(0, duration, this.travelOverlap));
    this.updateTarget(coordinates);

    setTimeout(() => {
      this.log.info(
        `Chain travel: ${nextTravelDelay}ms @ ${feedrate}mm/s`,
        coordinates
      );
      this.move(true)
        .then()
        .catch((err) => {
          this.log.error(err);
        });
    }, nextTravelDelay);

    return this.scope.travel(coordinates, this.baseFeedrate * this.boost);
  }

  /**
   * The current UX state of the component.
   */
  get state(): StageState {
    return {
      travelPower: this.travelPower,
      boostPower: this.boostPower,
      focusStep: this.focusStep,
      homed: this.homed,
      moveRate: this.moveRate,
      position: this.position,
      targetPosition: this.targetPosition,
      limits: this.limits,
    };
  }
}
