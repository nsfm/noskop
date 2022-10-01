import {
  ObjectType,
  Field,
  FieldResolver,
  Root,
  Resolver,
  ResolverInterface,
  Query,
  Mutation,
  Arg,
  InputType,
  Float,
  Int,
} from "type-graphql";
import { Min, Max } from "class-validator";
import { Service } from "typedi";
import { Dualsense } from "dualsense-ts";

import { ControllerService } from "./controller";
import { LogService, Logger } from "./log";
import { ScopeService } from "./scope";
import { CoordinateSet } from "../cnc";
import { Multiplier, Hertz, Millimeters, MillimetersPerSecond } from "../units";
import { lerp } from "../math";

@ObjectType()
export class StagePosition {
  @Field(() => Float)
  x: Millimeters = 0;

  @Field(() => Float)
  y: Millimeters = 0;

  @Field(() => Float)
  z: Millimeters = 0;
}

export type StageLimits = StagePosition;

/**
 * Stage manages travel on the X, Y and Z axis for a connected Scope.
 */
@Service()
@ObjectType()
export class Stage {
  @Field(() => Float, { description: "Multiplies controller boost" })
  @Min(1)
  @Max(200)
  public boostPower: Multiplier = 80;

  @Field(() => Float, {
    description: "Multiplies max distance travelled in a single step",
  })
  @Min(0.1)
  @Max(20)
  public travelPower: Multiplier = 5;

  @Field(() => Float, {
    description: "Distance per travel tick when moving on the Z axis",
  })
  @Min(0.00001)
  @Max(10)
  public focusStep: Millimeters = 0.01;

  @Field(() => Boolean, {
    description: "True when the stage knows its position",
  })
  public homed: boolean = false;

  @Field(() => StagePosition, {
    description:
      "Current position of the stage; relative if this.homed is false",
  })
  public position: StagePosition = { x: 0, y: 0, z: 0 };

  @Field(() => StagePosition, {
    description:
      "Position we are currently moving to; relative if homed is false",
  })
  public targetPosition: StagePosition = { x: 0, y: 0, z: 0 };

  @Field(() => [StagePosition], {
    description: "When homed is true, restrict travel between these limits",
  })
  public limits: [StageLimits, StageLimits] = [
    { x: -75, y: -75, z: -75 },
    { x: 75, y: 75, z: 75 },
  ];

  @Field(() => Int, {
    description: "Controller inputs are processed this many times per second",
  })
  @Min(1)
  @Max(120)
  public readonly moveRate: Hertz = 15;

  private readonly log: Logger;
  private readonly controller: Dualsense;

  constructor(
    { controller }: ControllerService,
    logger: LogService,
    public scope: ScopeService
  ) {
    this.controller = controller;
    this.log = logger.spawn("Stage");

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

  @Field(() => Float, {
    description:
      "Maximum feedrate multiplier, describing boost range/precision",
  })
  get maxBoost(): Multiplier {
    const { circle, square } = this.controller;
    return this.boostPower / (circle.state ? 0.5 : square.state ? 2 : 1);
  }

  @Field(() => Float, {
    description:
      "Return a feedrate multiplier using the trigger states. Left trigger applies a linear boost up to this.maxBoost. Right trigger applies a linear brake to the overall speed ",
  })
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
    if (!followUp && this.scope.scope.busy()) return;

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
}

@InputType()
class StageSettings {
  @Field(() => Float, {
    nullable: true,
    description: "Multiplies controller boost",
  })
  @Min(1)
  @Max(200)
  public boostPower?: Multiplier = 80;

  @Field(() => Float, {
    nullable: true,
    description: "Multiplies max distance travelled in a single step",
  })
  @Min(0.1)
  @Max(20)
  public travelPower?: Multiplier = 5;

  @Field(() => Float, {
    nullable: true,
    description: "Distance per travel tick when moving on the Z axis",
  })
  @Min(0.00001)
  @Max(10)
  public focusStep?: Millimeters = 0.01;
}

@Service()
@Resolver(() => Stage)
export class StageResolver {
  constructor(private service: Stage) {}

  @Query(() => Stage)
  stage() {
    return this.service;
  }

  @Mutation(() => Stage)
  configureStage(@Arg("settings") settings: StageSettings): Stage {
    const { boostPower, travelPower, focusStep } = settings;
    if (boostPower) this.service.boostPower = boostPower;
    if (travelPower) this.service.travelPower = travelPower;
    if (focusStep) this.service.focusStep = focusStep;
    return this.service;
  }
}
