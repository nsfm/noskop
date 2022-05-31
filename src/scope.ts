import { Marlin } from "./marlin";

export class Scope extends Marlin {
  async setup(): Promise<void> {
    await this.setTravelUnit();
    await this.setMinFeedrate(0.001);
    await this.setMaxFeedrate(200);
    await this.setMaxAcceleration(500);
    await this.setMaxJerk(10);
    await this.setTemperatureInterval(20);
    await this.setPositionInterval(5);

    await this.setStepsPerUnit("X", 400);
    await this.setAxisJerk("X", 10);
    await this.setAxisAcceleration("X", 200);
    await this.setAxisFeedrate("X", 100);

    await this.setStepsPerUnit("Y", 400);
    await this.setAxisJerk("Y", 10);
    await this.setAxisAcceleration("Y", 200);
    await this.setAxisFeedrate("Y", 100);

    await this.setStepsPerUnit("Z", 50); // 1/4th turn
    await this.relativeMode();
    await this.setInactivityShutdown(300);

    await this.setFeedrate(1);
  }

  async jingle(): Promise<void> {
    await this.tone(50, 450);
    await this.tone(100, 600);
  }

  async shutdown(): Promise<void> {
    await this.disableSteppers();
  }
}
