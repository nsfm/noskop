import {
  SerialCNC,
  Command,
  CoordinateSet,
  MachineAxis,
  CNCParams,
} from "./cnc";
import {
  Seconds,
  Index,
  Count,
  Percentage,
  Milliseconds,
  Hertz,
  Millimeters,
  MillimetersPerSecond,
  MillimetersPerSecondPerSecond,
  MillimetersPerSecondPerSecondPerSecond,
} from "../units";

export interface StepperConfig {
  // Display name for the motor
  name: string;
  // Physical port index on the Marlin board
  port: number;
  // The physical axis this stepper controls (relates to port)
  axis: MachineAxis;
  // Number of stepper steps required to travel 1mm
  steps: number;
  // Reverses the direction of travel for this axis
  invert: boolean;
  // Sets max values for several travel properties
  max: {
    feedrate: number; // millimeters/second
    acceleration: number; // mm/s^2
    jerk: number; // mm/s^3
  };
}

export interface MovementConfig {
  inactivityShutdown: Seconds;
  minFeedrate: MillimetersPerSecond;
  maxFeedrate: MillimetersPerSecond;
  maxAcceleration: MillimetersPerSecondPerSecond;
  maxJerk: MillimetersPerSecondPerSecondPerSecond;
  steppers: StepperConfig[];
}

/**
 * Provides a Marlin gcode instruction set on top of a SerialCNC device.
 */
export class Marlin extends SerialCNC {
  // Number of decimal places for move precision
  private precision: number = 4; // 0.1um

  // Tracks reversed axes
  private invert: { [key: string]: boolean } = {};

  constructor(params: CNCParams = {}) {
    super(params);
    this.log = this.log.child({ module: "Marlin" });
  }

  async setFeedback(): Promise<void> {
    await this.setTemperatureInterval(20);
    await this.setPositionInterval(5);
  }

  async setMechanics(config: MovementConfig): Promise<void> {
    const {
      inactivityShutdown,
      minFeedrate,
      maxFeedrate,
      maxAcceleration,
      maxJerk,
      steppers,
    } = config;

    // Disable movement during setup
    await this.setFeedrate(0);

    await this.allowColdExtrusion();
    await this.setTravelUnit();
    await this.relativeMode();

    await this.setInactivityShutdown(inactivityShutdown);
    await this.setMinFeedrate(minFeedrate);
    await this.setMaxFeedrate(maxFeedrate);
    await this.setMaxAcceleration(maxAcceleration);
    await this.setMaxJerk(maxJerk);

    for (const stepper of steppers) {
      await this.configureStepper(stepper);
    }

    await this.setFeedrate(1);
  }

  async configureStepper(config: StepperConfig): Promise<void> {
    const {
      axis,
      steps,
      invert,
      max: { jerk, acceleration, feedrate },
    } = config;

    this.invert[axis] = invert;
    await this.setStepsPerUnit(axis, steps);
    await this.setAxisJerk(axis, jerk);
    await this.setAxisAcceleration(axis, acceleration);
    await this.setAxisFeedrate(axis, feedrate);
  }

  // Returns 1 or -1 according to invert settings
  axisModifier(axis: MachineAxis): -1 | 1 {
    return this.invert[axis] ? -1 : 1;
  }

  linearMove(
    { x, y, z, e }: CoordinateSet,
    feedrate: MillimetersPerSecond
  ): Promise<Command> {
    const { precision } = this;
    return this.command(
      "Move",
      `G0 X${(this.axisModifier("X") * x).toPrecision(precision)} Y${(
        this.axisModifier("Y") * y
      ).toPrecision(precision)} Z${(this.axisModifier("Z") * z).toPrecision(
        precision
      )} E${(this.axisModifier("E") * e).toPrecision(
        this.precision
      )} F${feedrate}`
    );
  }

  // TODO
  arcMove(): Promise<Command> {
    return this.command("Arc", `G2 I20 J20`);
  }

  // TODO mm to lower
  home(stageLower: Millimeters = 5): Promise<Command> {
    return this.command("Home", `G28\n O R${stageLower} X Y Z`);
  }

  absoluteMode(): Promise<Command> {
    return this.command("Absolute Mode", "G90");
  }

  relativeMode(): Promise<Command> {
    return this.command("Relative Mode", "G91");
  }

  allowColdExtrusion(): Promise<Command> {
    return this.command("Allow Cold Extrusion", "M302 S0");
  }

  // Inactivity - seconds until automatic shutoff without movement
  setSteppers(state: boolean, inactivity?: Seconds): Promise<Command> {
    return state
      ? this.command("Steppers Off", "M17")
      : this.command(
          "Steppers On",
          `M18 ${inactivity ? `S${inactivity}` : ""}`
        );
  }

  enableSteppers(): Promise<Command> {
    return this.setSteppers(true);
  }

  disableSteppers(): Promise<Command> {
    return this.setSteppers(false);
  }

  setFan(index: Index, speed: Percentage): Promise<Command> {
    if (speed < 0 || speed > 1) throw this.unexpected("Fan speed outta bounds");
    return this.command("Set Fan", `M106 I${index} S${speed * 255}`);
  }

  disableFan(index: Index): Promise<Command> {
    return this.command("Disable Fan", `M107 I${index}`);
  }

  // To millimeters
  setTravelUnit(): Promise<Command> {
    return this.command("Set Units", "G21");
  }

  keepalive(interval: Seconds): Promise<Command> {
    return this.command("Keepalive", `M113 S${interval}`);
  }

  // Drops homing
  cancelMove(): Promise<Command> {
    return this.priorityCommand("Cancel Move", "G80");
  }

  // Drops homing
  stop(): Promise<Command> {
    return this.priorityCommand("Stop", "M112");
  }

  // Drops homing
  quickstop(): Promise<Command> {
    return this.priorityCommand("Quickstop", "M410");
  }

  deployProbe(): Promise<Command> {
    return this.command("Deploy Probe", "M401");
  }

  stowProbe(): Promise<Command> {
    return this.command("Stow Probe", "M402");
  }

  // 0 to disable
  setTemperatureInterval(seconds: Seconds): Promise<Command> {
    return this.command("Temperature Interval", `M155 S${seconds}`);
  }

  // 0 to disable
  setPositionInterval(seconds: Seconds): Promise<Command> {
    return this.command("Position Interval", `M154 S${seconds}`);
  }

  setStepsPerUnit(axis: "X" | "Y" | "Z" | "E", steps: Count): Promise<Command> {
    return this.command(`Steps per Unit (${axis})`, `M92 ${axis}${steps}`);
  }

  setAxisFeedrate(
    axis: "X" | "Y" | "Z" | "E",
    feedrate: MillimetersPerSecond
  ): Promise<Command> {
    return this.command("Max Feedrate", `M203 ${axis}${feedrate}`);
  }

  setMaxFeedrate(feedrate: MillimetersPerSecond): Promise<Command> {
    return this.command(
      "Max Feedrate",
      `M203 X${feedrate} Y${feedrate} Z${feedrate} E${feedrate}`
    );
  }

  // Apply a global speed modifier. 0 - 0% to 1 - 100%
  setFeedrate(percentage: Percentage): Promise<Command> {
    return this.command(
      "Set Feedrate",
      `M203 S${Math.round(percentage * 100)}`
    );
  }

  setMinFeedrate(feedrate: MillimetersPerSecond): Promise<Command> {
    return this.command("Min Feedrate", `M205 T${feedrate} S${feedrate}`);
  }

  setAxisAcceleration(
    axis: "X" | "Y" | "Z" | "E",
    acceleration: MillimetersPerSecondPerSecond
  ): Promise<Command> {
    return this.command("Max Acceleration", `M201 ${axis}${acceleration}`);
  }

  setMaxAcceleration(
    acceleration: MillimetersPerSecondPerSecond
  ): Promise<Command> {
    return this.command(
      "Max Acceleration",
      `M201 X${acceleration} Y${acceleration} Z${acceleration} E${acceleration}`
    );
  }

  setAxisJerk(
    axis: "X" | "Y" | "Z" | "E",
    jerk: MillimetersPerSecondPerSecondPerSecond
  ): Promise<Command> {
    return this.command(`${axis} Jerk`, `M205 ${axis}${jerk}`);
  }

  setMaxJerk(jerk: MillimetersPerSecondPerSecondPerSecond): Promise<Command> {
    return this.command("Max Jerk", `M205 X${jerk} Y${jerk} Z${jerk} E${jerk}`);
  }

  babystep(axis: "X" | "Y" | "Z", distance: Millimeters): Promise<Command> {
    return this.command("Babystep", `M290 ${axis}${distance}`);
  }

  tone(duration: Milliseconds, frequency: Hertz): Promise<Command> {
    return this.command(
      `Tone (${frequency}hz)`,
      `M300 P${duration} S${frequency}`
    );
  }

  getEndstopStates(): Promise<Command> {
    return this.command("Check Endstops", "M119");
  }

  enableEndStops(): Promise<Command> {
    return this.command("Enable Endstops", "M120");
  }

  disableEndStops(): Promise<Command> {
    return this.command("Disable Endstops", "M121");
  }

  dwell(milliseconds: Milliseconds): Promise<Command> {
    return this.command("Dwell", `G4 P${milliseconds}`);
  }

  finish(): Promise<Command> {
    return this.command("Finish Up", "M400");
  }

  setInactivityShutdown(seconds: Seconds): Promise<Command> {
    return this.command("Set Auto-Shutdown", `M85 ${Math.floor(seconds)}`);
  }

  setLED(
    index: Index,
    red: Percentage,
    green: Percentage,
    blue: Percentage,
    brightness: Percentage
  ): Promise<Command> {
    return this.command(
      "Set LEDs",
      `G4 I${index} R${red * 255} G${green * 255} B${blue * 255} P:${
        brightness * 255
      }`
    );
  }
}
