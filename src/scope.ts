import { Marlin } from "./marlin";

export class Scope extends Marlin {
  async setup(): Promise<void> {
    await this.setTravelUnit();
    await this.setMinFeedrate(1);
    await this.setMaxFeedrate(5);
    await this.setMaxAcceleration(5);
    await this.setMaxJerk(1);
    await this.setTemperatureInterval(20);
    await this.setPositionInterval(5);
    await this.setStepsPerUnit("X", 50); // 1/8th turn
    await this.setStepsPerUnit("Y", 50);
    await this.setStepsPerUnit("Z", 50); // 1/4th turn
    await this.relativeMode();
    await this.setInactivityShutdown(300);
  }

  async jingle(): Promise<void> {
    await this.tone(50, 450);
    await this.deployProbe();
    await this.tone(100, 600);
    await this.stowProbe();
  }

  async shutdown(): Promise<void> {
    await this.disableSteppers();
    await this.stowProbe();
  }
}
