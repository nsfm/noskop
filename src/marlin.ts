import { SerialPort } from "serialport";
import { DelimiterParser } from "@serialport/parser-delimiter";
import winston, { Logger } from "winston";

export interface Command {
  resolve: (cmd: Command) => void;
  reject: (reason: string) => void;
  command: string;
  requested: number;
  priority: boolean;
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
      params.logger ||
      winston.createLogger({
        level: "debug",
        format: winston.format.prettyPrint(),
      });

    this.port = new SerialPort({
      path: "/dev/ttyUSB0",
      autoOpen: true,
      baudRate: 115200,
    });

    this.parser = this.port.pipe(new DelimiterParser({ delimiter: "\n" }));
    this.parser.on("data", (data: Buffer) => this.process(data));

    setInterval(() => {
      this.transmit();
    }, 1000 / this.commandRate);
  }

  command(command: string, priority: boolean = false): Promise<Command> {
    if (command.includes("\n"))
      throw this.unexpected("Cannot include newline in command");

    return new Promise((resolve, reject) => {
      const cmd: Command = {
        command,
        resolve,
        reject,
        requested: Date.now(),
        priority,
      };
      priority ? this.commandQueue.unshift(cmd) : this.commandQueue.push(cmd);
    });
  }

  priorityCommand(command: string): Promise<Command> {
    return this.command(command, true);
  }

  transmit(): void {
    if (this.pendingCommand) return;

    this.pendingCommand = this.commandQueue.shift() || null;
    if (this.pendingCommand) {
      this.pendingCommand.send = Date.now();
      this.debug
        ? this.log[this.pendingCommand.priority ? "warn" : "info"](
            `-> ${this.pendingCommand.command}`
          )
        : this.port.write(this.pendingCommand.command);
      this.pendingCommand.sent = Date.now();
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
    this.log.info(line);
    if (this.pendingCommand) {
      this.pendingCommand.completed = Date.now();
      this.pendingCommand.response = line.toString();
      this.pendingCommand.success = line.toString() === "ok";
    }
  }

  linearMove({
    x,
    y,
    z,
    e,
  }: {
    x: number;
    y: number;
    z: number;
    e: number;
  }): Promise<Command> {
    return this.command(`G0 X${x} Y${y} Z${z} E${e} F${this.feedrate}`);
  }

  // TODO
  arcMove(): Promise<Command> {
    return this.command(`G2 I20 J20`);
  }

  // TODO mm to lower
  home(stageLower: number = 5): Promise<Command> {
    return this.command(`G28\n O R${stageLower} X Y Z`);
  }

  absoluteMode(): Promise<Command> {
    return this.command("G90");
  }

  relativeMode(): Promise<Command> {
    return this.command("G91");
  }

  // Inactivity - seconds until automatic shutoff without movement
  setSteppers(state: boolean, inactivity?: number): Promise<Command> {
    const result = state
      ? this.command("M17")
      : this.command(`M18 ${inactivity ? `S${inactivity}` : ""}`);
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
    return this.command(`M106 I${index} S${speed}`);
  }

  disableFan(index: number): Promise<Command> {
    return this.command(`M107 I${index}`);
  }

  // To millimeters
  setTravelUnit(): Promise<Command> {
    return this.command("G21");
  }

  keepalive(interval: number): Promise<Command> {
    return this.command(`M113 S${interval}`);
  }

  // Drops homing
  cancelMove(): Promise<Command> {
    return this.priorityCommand("G80");
  }

  // Drops homing
  stop(): Promise<Command> {
    return this.priorityCommand("M112");
  }

  // Drops homing
  quickstop(): Promise<Command> {
    return this.priorityCommand("M410");
  }

  deployProbe(): Promise<Command> {
    return this.command("M401");
  }

  stowProbe(): Promise<Command> {
    return this.command("M402");
  }

  // 0 to disable
  setTemperatureInterval(seconds: number): Promise<Command> {
    return this.command(`M155 S${seconds}`);
  }

  // 0 to disable
  setPositionInterval(seconds: number): Promise<Command> {
    return this.command(`M154 S${seconds}`);
  }

  setStepsPerUnit(
    axis: "X" | "Y" | "Z" | "E",
    steps: number
  ): Promise<Command> {
    return this.command(`M92 ${axis}${steps}`);
  }

  // units-per-second
  setMaxFeedrate(
    axis: "X" | "Y" | "Z" | "E",
    feedrate: number
  ): Promise<Command> {
    return this.command(`M203 ${axis}${feedrate}`);
  }

  // Apply a global speed modifier. 0 - 0% to 1 - 100%
  setFeedrate(percentage: number): Promise<Command> {
    return this.command(`M203 S${Math.round(percentage * 100)}`);
  }

  // units-per-second
  setMinFeedrate(feedrate: number): Promise<Command> {
    return this.command(`M205 T${feedrate} S${feedrate}`);
  }

  // units-per-second-squared
  setMaxAcceleration(
    axis: "X" | "Y" | "Z" | "E",
    acceleration: number
  ): Promise<Command> {
    return this.command(`M201 ${axis}${acceleration}`);
  }

  // units-per-second
  setMaxJerk(axis: "X" | "Y" | "Z" | "E", jerk: number): Promise<Command> {
    return this.command(`M205 ${axis}${jerk}`);
  }

  babystep(axis: "X" | "Y" | "Z", distance: number): Promise<Command> {
    return this.command(`M290 ${axis}${distance}`);
  }

  tone(milliseconds: number, frequency: number): Promise<Command> {
    return this.command(`M300 P${milliseconds} S${frequency}`);
  }

  getEndstopStates(): Promise<Command> {
    return this.command("M119");
  }

  enableEndStops(): Promise<Command> {
    return this.command("M120");
  }

  disableEndStops(): Promise<Command> {
    return this.command("M121");
  }

  dwell(milliseconds: number): Promise<Command> {
    return this.command(`G4 P${milliseconds}`);
  }

  setLED(
    index: number,
    red: number,
    green: number,
    blue: number,
    brightness: number
  ): Promise<Command> {
    return this.command(
      `G4 I${index} R${red} G${green} B${blue} P:${brightness}`
    );
  }
}
