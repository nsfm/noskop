import { SerialPort } from "serialport";

export class Scope {
  private port: SerialPort;
  public feedrate: number = 1000;

  constructor() {
    this.port = new SerialPort({
      path: "/dev/ttyUSB0",
      autoOpen: true,
      baudRate: 115200,
    });

    this.port.on("data", (data: Buffer) => this.process(data));
  }

  // Handle feedback from the device
  process(data: Buffer): void {
    console.log(data);
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
  }): this {
    this.port.write(`G0 X${x} Y${y} Z${z} E${e} F${this.feedrate}\n`);
    return this;
  }

  // TODO
  arcMove(): this {
    this.port.write(`G2 I20 J20`);
    return this;
  }

  home(): this {
    const stageLower = 5; // mm
    this.port.write(`G28\n O R${stageLower} X Y Z`);
    return this;
  }

  absoluteMode(): this {
    this.port.write("G90\n");
    return this;
  }

  relativeMode(): this {
    this.port.write("G91\n");
    return this;
  }

  steppersOn(): this {
    this.port.write("M17\n");
    return this;
  }

  // speed: 0 -255
  setFan(index: number, speed: number): this {
    this.port.write(`M106 I${index} S${speed}\n`);
    return this;
  }

  disableFan(index: number): this {
    this.port.write(`M107 I${index}\n`);
    return this;
  }

  // Inactivity - seconds until automatic shutoff without movement
  steppersOff(inactivity?: number): this {
    this.port.write(`M18\n ${inactivity ? `S${inactivity}` : ""}`);
    return this;
  }

  // To millimeters
  setTravelUnit(): this {
    this.port.write("G21\n");
    return this;
  }

  keepalive(interval: number): this {
    this.port.write(`M113 S${interval}\n`);
    return this;
  }

  // Drops homing
  cancelMove(): this {
    this.port.write("G80\n");
    return this;
  }

  // Drops homing
  stop(): this {
    this.port.write("M112\n");
    return this;
  }

  // Drops homing
  quickstop(): this {
    this.port.write("M410\n");
    return this;
  }

  deployProbe(): this {
    this.port.write("M401\n");
    return this;
  }

  stowProbe(): this {
    this.port.write("M402\n");
    return this;
  }

  // 0 to disable
  setTemperatureInterval(seconds: number) {
    this.port.write(`M155 S${seconds}\n`);
    return this;
  }

  // 0 to disable
  setPositionInterval(seconds: number) {
    this.port.write(`M154 S${seconds}\n`);
    return this;
  }

  setStepsPerUnit(axis: "X" | "Y" | "Z" | "E", steps: number): this {
    this.port.write(`M92 ${axis}${steps}\n`);
    return this;
  }

  // units-per-second
  setMaxFeedrate(axis: "X" | "Y" | "Z" | "E", feedrate: number): this {
    this.port.write(`M203 ${axis}${feedrate}\n`);
    return this;
  }

  // units-per-second
  setMinFeedrate(feedrate: number): this {
    this.port.write(`M205 T${feedrate} S${feedrate}\n`);
    return this;
  }

  // units-per-second-squared
  setMaxAcceleration(axis: "X" | "Y" | "Z" | "E", acceleration: number): this {
    this.port.write(`M201 ${axis}${acceleration}\n`);
    return this;
  }

  // units-per-second
  setMaxJerk(axis: "X" | "Y" | "Z" | "E", jerk: number): this {
    this.port.write(`M205 ${axis}${jerk}\n`);
    return this;
  }

  babystep(axis: "X" | "Y" | "Z", distance: number): this {
    this.port.write(`M290 ${axis}${distance}\n`);
    return this;
  }

  tone(milliseconds: number, frequency: number): this {
    this.port.write(`M300 P${milliseconds} S${frequency}\n`);
    return this;
  }

  getEndstopStates(): this {
    this.port.write("M119\n");
    return this;
  }

  enableEndStops(): this {
    this.port.write("M120\n");
    return this;
  }

  disableEndStops(): this {
    this.port.write("M121\n");
    return this;
  }

  dwell(milliseconds: number): this {
    this.port.write(`G4 P${milliseconds}`);
    return this;
  }

  setLED(
    index: number,
    red: number,
    green: number,
    blue: number,
    brightness: number
  ): this {
    this.port.write(`G4 I${index} R${red} G${green} B${blue} P:${brightness} `);
    return this;
  }
}
