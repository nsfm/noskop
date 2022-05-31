import { SerialCNC, Command, CoordinateSet } from "./cnc";

/**
 * Provides a Marlin-based gcode instruction set on top of a SerialCNC device.
 */
export class Marlin extends SerialCNC {
  // Number of decimal places for move precision
  private precision: number = 4; // 0.1um

  linearMove(
    { x, y, z, e }: CoordinateSet,
    feedrate: number
  ): Promise<Command> {
    const { precision } = this;
    return this.command(
      "Move",
      `G0 X${x.toPrecision(precision)} Y${y.toPrecision(
        precision
      )} Z${z.toPrecision(precision)} E${e.toPrecision(
        this.precision
      )} F${feedrate}`
    );
  }

  // TODO
  arcMove(): Promise<Command> {
    return this.command("Arc", `G2 I20 J20`);
  }

  // TODO mm to lower
  home(stageLower: number = 5): Promise<Command> {
    return this.command("Home", `G28\n O R${stageLower} X Y Z`);
  }

  absoluteMode(): Promise<Command> {
    return this.command("Absolute Mode", "G90");
  }

  relativeMode(): Promise<Command> {
    return this.command("Relative Mode", "G91");
  }

  // Inactivity - seconds until automatic shutoff without movement
  setSteppers(state: boolean, inactivity?: number): Promise<Command> {
    const result = state
      ? this.command("Steppers Off", "M17")
      : this.command(
          "Steppers On",
          `M18 ${inactivity ? `S${inactivity}` : ""}`
        );
    result
      .then(({ success }) => {
        success ? (this.steppersEnabled = state) : this.unexpected("A");
      })
      .catch(() => {
        throw this.unexpected("B");
      });
    return result;
  }

  enableSteppers(): Promise<Command> {
    return this.setSteppers(true);
  }

  disableSteppers(): Promise<Command> {
    return this.setSteppers(false);
  }

  setFan(index: number, speed: number): Promise<Command> {
    if (speed < 0 || speed > 255)
      throw this.unexpected("Fan speed outta bounds");
    return this.command("Set Fan", `M106 I${index} S${speed}`);
  }

  disableFan(index: number): Promise<Command> {
    return this.command("Disable Fan", `M107 I${index}`);
  }

  // To millimeters
  setTravelUnit(): Promise<Command> {
    return this.command("Set Units", "G21");
  }

  keepalive(interval: number): Promise<Command> {
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
  setTemperatureInterval(seconds: number): Promise<Command> {
    return this.command("Temperature Interval", `M155 S${seconds}`);
  }

  // 0 to disable
  setPositionInterval(seconds: number): Promise<Command> {
    return this.command("Position Interval", `M154 S${seconds}`);
  }

  setStepsPerUnit(
    axis: "X" | "Y" | "Z" | "E",
    steps: number
  ): Promise<Command> {
    return this.command(`Steps per Unit (${axis})`, `M92 ${axis}${steps}`);
  }

  // units-per-second
  setAxisFeedrate(
    axis: "X" | "Y" | "Z" | "E",
    feedrate: number
  ): Promise<Command> {
    return this.command("Max Feedrate", `M203 ${axis}${feedrate}`);
  }

  // units-per-second
  setMaxFeedrate(feedrate: number): Promise<Command> {
    return this.command(
      "Max Feedrate",
      `M203 X${feedrate} Y${feedrate} Z${feedrate} E${feedrate}`
    );
  }

  // Apply a global speed modifier. 0 - 0% to 1 - 100%
  setFeedrate(percentage: number): Promise<Command> {
    return this.command(
      "Set Feedrate",
      `M203 S${Math.round(percentage * 100)}`
    );
  }

  // units-per-second
  setMinFeedrate(feedrate: number): Promise<Command> {
    return this.command("Min Feedrate", `M205 T${feedrate} S${feedrate}`);
  }

  // units-per-second-squared
  setAxisAcceleration(
    axis: "X" | "Y" | "Z" | "E",
    acceleration: number
  ): Promise<Command> {
    return this.command("Max Acceleration", `M201 ${axis}${acceleration}`);
  }

  // units-per-second-squared
  setMaxAcceleration(acceleration: number): Promise<Command> {
    return this.command(
      "Max Acceleration",
      `M201 X${acceleration} Y${acceleration} Z${acceleration} E${acceleration}`
    );
  }

  // units-per-second
  setAxisJerk(axis: "X" | "Y" | "Z" | "E", jerk: number): Promise<Command> {
    return this.command(`${axis} Jerk`, `M205 ${axis}${jerk}`);
  }

  // units-per-second
  setMaxJerk(jerk: number): Promise<Command> {
    return this.command("Max Jerk", `M205 X${jerk} Y${jerk} Z${jerk} E${jerk}`);
  }

  babystep(axis: "X" | "Y" | "Z", distance: number): Promise<Command> {
    return this.command("Babystep", `M290 ${axis}${distance}`);
  }

  tone(milliseconds: number, frequency: number): Promise<Command> {
    return this.command(
      `Tone (${frequency}hz)`,
      `M300 P${milliseconds} S${frequency}`
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

  dwell(milliseconds: number): Promise<Command> {
    return this.command("Dwell", `G4 P${milliseconds}`);
  }

  finish(): Promise<Command> {
    return this.command("Finish Up", "M400");
  }

  setInactivityShutdown(seconds: number): Promise<Command> {
    return this.command("Set Auto-Shutdown", `M85 ${Math.floor(seconds)}`);
  }

  setLED(
    index: number,
    red: number,
    green: number,
    blue: number,
    brightness: number
  ): Promise<Command> {
    return this.command(
      "Set LEDs",
      `G4 I${index} R${red} G${green} B${blue} P:${brightness}`
    );
  }
}
