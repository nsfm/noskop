import { SerialPort } from "serialport";
import { DelimiterParser } from "@serialport/parser-delimiter";
import { SerialPortStream } from "@serialport/stream";
import { MockBinding, MockPortBinding } from "@serialport/binding-mock";
import { autoDetect } from "@serialport/bindings-cpp";
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

export interface CNCParams {
  logger?: Logger;
  // Path for serial port, or vendor and product IDs to search for
  port?: string | { vendorId: string; productId: string };
  commandRate?: number; // hz
  debug?: boolean; // when true - only log actions
}

export type MachineAxis = "X" | "Y" | "Z" | "E";

export interface CoordinateSet {
  x: number;
  y: number;
  z: number;
  e: number;
}

/**
 * Generic serial device that accepts a stream of gcode commands and responds with confirmations.
 */
export abstract class SerialCNC {
  public steppersEnabled: boolean = false;

  private commandQueue: Command[] = [];
  private pendingCommand: Command | null = null;
  private portPath: string = "/dev/ttyACM0";
  private port: SerialPortStream;
  private parser: DelimiterParser;

  readonly debug: boolean;
  readonly commandRate: number;

  public log: Logger;

  constructor(params: CNCParams = {}) {
    this.debug = params.debug || false;
    this.commandRate = params.commandRate || 15;

    this.log =
      params.logger?.child({ module: "CNC" }) ||
      Logger.createLogger({
        name: "CNC",
        level: "debug",
      });

    if (this.debug) {
      this.log.warn("Starting in debug mode");
      MockBinding.createPort(this.portPath, { echo: true });
    }

    this.log.info(SerialPort.list());
    this.port = new SerialPortStream({
      binding: this.debug ? MockBinding : autoDetect(),
      path: this.portPath,
      autoOpen: true,
      baudRate: 115200,
    });

    this.parser = this.port.pipe(new DelimiterParser({ delimiter: "\n" }));
    this.parser.on("data", (data: Buffer) => this.process(data));

    this.port.on("open", () => {
      this.log.debug("Serial port connected");
      setInterval(() => {
        this.transmit();
      }, 1000 / this.commandRate);
    });
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
      this.port.write(`${this.pendingCommand.command}\n`);
      this.pendingCommand.sent = Date.now();
      this.debugConfirm();
    }
  }

  /**
   * Delays and eventually sends a mock response to the mock serial interface.
   * @param delay Minimum number of milliseconds to wait before responding
   */
  debugConfirm(delay: number = 5): void {
    if (this.debug) {
      setTimeout(() => {
        if (this.port.port instanceof MockPortBinding) {
          this.port.port.emitData(Buffer.from("ok"));
        }
      }, Math.random() * 10 + delay);
    }
  }

  // Returns true if there are any pending commands
  busy(): boolean {
    return this.commandQueue.length > 0;
  }

  abstract stop(): Promise<Command>;

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

    if (msg.includes("echo:busy:")) {
      this.log.debug("Busy...");
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
}
