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
  // Maximum number of commands that can be sent to the device per second
  commandRate?: number;
  // When true, don't connect to a USB device - just log all commands
  debug?: boolean;
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

  /**
   * Add a command to the end of the local queue, to execute when the device is idle.
   */
  command(
    description: string,
    command: string,
    priority: boolean = false
  ): Promise<Command> {
    this.validateCommand(command);

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

  /**
   * Ensure that provided commands match our processing rules.
   */
  validateCommand(command: string): void {
    if (command.includes("\n"))
      throw this.unexpected("Cannot include newline in command");
  }

  /**
   * Add a command to the front of the local queue, so it can be executed ASAP.
   */
  priorityCommand(what: string, command: string): Promise<Command> {
    return this.command(what, command, true);
  }

  /**
   * Write the command out over the wire to the device.
   */
  transmit(): void {
    if (this.pendingCommand) return;

    this.pendingCommand = this.commandQueue.shift() || null;
    if (this.pendingCommand) {
      const { priority, description, command } = this.pendingCommand;
      this.pendingCommand.send = Date.now();
      this.log[priority ? "warn" : "debug"](`${description} -> ${command}`);
      this.port.write(`${command}\n`);
      this.pendingCommand.sent = Date.now();
      this.debugConfirm(command);
    }
  }

  /**
   * Simulates command confirmations in debug mode.
   */
  debugConfirm(command: string = "unknown"): void {
    if (!this.debug) return;

    const delay =
      command.startsWith("M400") || command.startsWith("G28")
        ? 500
        : Math.random() * 10 + 10;

    setTimeout(() => {
      if (this.port.port instanceof MockPortBinding) {
        this.port.port.emitData(Buffer.from("ok"));
      }
    }, delay);
  }

  /**
   * Returns true if there are any pending commands.
   */
  busy(): boolean {
    return this.commandQueue.length > 0;
  }

  abstract stop(): Promise<Command>;

  /**
   * Called when something unexpected happens. Disconnects the machine.
   */
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

  /**
   * Handle feedback from the device.
   */
  process(line: Buffer): void {
    const msg = line.toString().trim();

    // Variety of messages come through this way, mostly UI hints.
    if (msg.includes("//")) {
      this.log.debug(`[comment] <- ${msg}`);
      return;
    }

    // Sent while waiting for some long command to finish up.
    if (msg.includes("echo:busy:")) {
      this.log.debug("Busy...");
      return;
    }

    // TODO Regex
    if (msg.startsWith("X")) {
      return this.updatePosition(msg);
    }

    // TODO Regex
    if (msg.startsWith("T")) {
      return this.updateTemperature(msg);
    }

    // If we previously sent a command, assume any other ouput is a response for that.
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
