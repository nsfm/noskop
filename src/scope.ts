import { Marlin } from "./marlin";

export class Scope extends Marlin {
  async setup(): Promise<void> {
    await this.jingle();
    await this.setTravelUnit();
    await this.setTemperatureInterval(10);
    await this.setPositionInterval(1);
    await this.setStepsPerUnit("X", 30);
    await this.setStepsPerUnit("Y", 30);
    await this.setStepsPerUnit("Z", 30);
    await this.relativeMode();
  }

  async jingle(): Promise<void> {
    await this.tone(50, 450);
    await this.deployProbe();
    await this.tone(100, 600);
    await this.stowProbe();
  }

  async shutdown(): Promise<void> {
    await this.tone(400, 200);
    await this.tone(100, 100);
    await this.tone(200, 100);
    await this.tone(400, 300);
    await this.disableSteppers();
    await this.stowProbe();
  }
}
