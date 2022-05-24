import { SerialPort } from "serialport";
import { DelimiterParser } from "@serialport/parser-delimiter";
import Logger from "bunyan";

export interface Command {
  resolve: (cmd: Command) => void;
  reject: (reason: string) => void;
  command: string;
  requested: number;
  priority: boolean;
  description: string;
  response?: string;
  success?: boolean;
  send?: number;
  sent?: number;
  completed?: number;
}

export interface MarlinParams {
  logger?: Logger;
  commandRate?: number; // hz
  debug?: boolean; // when true - only log actions
}

export interface CoordinateSet {
  x: number;
  y: number;
  z: number;
  e: number;
}

export class Marlin {
  public feedrate: number = 1000; // mm/s
  public steppersEnabled: boolean = false;

  private commandQueue: Command[] = [];
  private pendingCommand: Command | null = null;
  private log: Logger;
  private port: SerialPort;
  private parser: DelimiterParser;

  private readonly debug: boolean;
  private readonly commandRate: number;

  constructor(params: MarlinParams = {}) {
    this.debug = params.debug || false;
    this.commandRate = params.commandRate || 15;
    this.log =
      params.logger?.child({ module: "Marlin" }) ||
      Logger.createLogger({
        name: "Marlin",
        level: "debug",
      });

    this.port = new SerialPort({
      path: "/dev/ttyACM0",
      autoOpen: true,
      baudRate: 115200,
    });

    this.parser = this.port.pipe(new DelimiterParser({ delimiter: "\n" }));
    this.parser.on("data", (data: Buffer) => this.process(data));

    setInterval(() => {
      this.transmit();
    }, 1000 / this.commandRate);
  }

  command(
    description: string,
    command: string,
    priority: boolean = false
  ): Promise<Command> {
    if (command.includes("\n"))
      throw this.unexpected("Cannot include newline in command");

    return new Promise((resolve, reject) => {
      const cmd: Command = {
        command,
        resolve,
        reject,
        requested: Date.now(),
        priority,
        description,
      };
      priority ? this.commandQueue.unshift(cmd) : this.commandQueue.push(cmd);
    });
  }

  priorityCommand(what: string, command: string): Promise<Command> {
    return this.command(what, command, true);
  }

  transmit(): void {
    if (this.pendingCommand) return;

    this.pendingCommand = this.commandQueue.shift() || null;
    if (this.pendingCommand) {
      this.pendingCommand.send = Date.now();
      this.log[this.pendingCommand.priority ? "warn" : "debug"](
        `${this.pendingCommand.description} -> ${this.pendingCommand.command}`
      );
      if (!this.debug) this.port.write(`${this.pendingCommand.command}\n`);
      this.pendingCommand.sent = Date.now();
      if (this.debug) this.process(Buffer.from("ok"));
    }
  }

  // Returns true if there are any pending commands
  busy(): boolean {
    return this.commandQueue.length > 0;
  }

  // Call this when something unexpected happens
  unexpected(reason: string): Error {
    this.log.error(`unexpected: ${reason}`);
    this.stop()
      .then(({ success }) => {
        if (!success) process.exit(9);
        this.log.error("unexpected: stopped");
      })
      .catch((err) => {
        this.log.error(err);
      });
    return new Error(reason);
  }

  // Handle feedback from the device
  process(line: Buffer): void {
    const msg = line.toString().trim();
    if (msg.includes("//")) {
      this.log.debug(`[comment] <- ${msg}`);
      return;
    }

    if (msg.startsWith("X")) {
      return this.updatePosition(msg);
    }

    if (msg.startsWith("T")) {
      return this.updateTemperature(msg);
    }

    if (this.pendingCommand) {
      this.log.info(`${this.pendingCommand.description} <- ${msg}`);
      this.pendingCommand.completed = Date.now();
      this.pendingCommand.response = line.toString();
      this.pendingCommand.success = line.toString() === "ok";
      this.pendingCommand.resolve(this.pendingCommand);
      this.pendingCommand = null;
    } else {
      this.log.info(`[received] <- ${msg}`);
    }
  }

  updatePosition(position: string): void {
    this.log.trace(`[position] <- ${position}`);
  }

  updateTemperature(temperature: string): void {
    this.log.trace(`[temperature] <- ${temperature}`);
  }

  linearMove({ x, y, z, e }: CoordinateSet): Promise<Command> {
    return this.command("Move", `G0 X${x} Y${y} Z${z} E${e} F${this.feedrate}`);
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
