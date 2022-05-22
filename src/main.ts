import { Dualsense } from "dualsense-ts";
import winston from "winston";

import { Scope } from "./scope";

class Noskop {
  private log = winston.createLogger({
    level: "debug",
    format: winston.format.prettyPrint(),
  });

  public scope: Scope = new Scope({ logger: this.log, debug: true });
  public controller: Dualsense = new Dualsense();

  async setup(): Promise<void> {
    await this.scope.setup();
    this.bindControls();
    setInterval(() => {
      this.render();
    }, 1000 / 1);
    this.log.info("Setup complete");
  }

  render(): void {
    this.log.debug(`Steppers: ${this.scope.steppersEnabled ? "off" : "on"}`);
  }

  bindControls() {
    this.controller.ps.on("change", async () => {
      if (this.controller.ps.state === false) return;
      this.log.info("Exit triggered, cleaning up");
      await this.scope.shutdown();
      process.exit(0);
    });

    this.controller.triangle.on("change", async () => {
      const res = await this.scope.getEndstopStates();
      this.log.info(`Endstops: ${res.response || "err"}`);
    });

    this.controller.circle.on("change", async (input) => {
      if (input.state === false) return;
      await this.scope.setSteppers(!this.scope.steppersEnabled);
      this.log.info(`Steppers: ${this.scope.steppersEnabled ? "no" : "yes"}`);
    });
  }
}

async function main() {
  const noskop = new Noskop();
  await noskop.setup();
}

await main();
