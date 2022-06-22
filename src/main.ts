import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { Scope } from "./scope";
import { movementConfig } from "./config";

/**
 * Configures and coordinates the other components, providing an
 * entry point for the tool.
 */
class Noskop {
  private log = Logger.createLogger({
    level: "debug",
    name: "noskop",
  });

  public scope: Scope = new Scope({
    logger: this.log,
    debug: !!process.env.DEBUG,
    commandRate: 60,
  });

  public controller: Dualsense = new Dualsense();

  async setup(): Promise<void> {
    await this.scope.setMechanics(movementConfig);
    this.bindControls();
    this.log.info("Setup complete");
  }

  /**
   * Assigns other controller actions
   */
  bindControls() {
    const {
      scope,
      controller: { ps, triangle, cross, mute },
    } = this;

    ps.on("press", async () => {
      await scope.shutdown();
      process.exit(0);
    });

    cross.on("press", async () => {
      const res = await scope.getEndstopStates();
      this.log.info(`Endstops: ${res.response || "err"}`);
    });

    triangle.on("press", async () => {
      this.log.info(`Running travel calibration`);
      const results = await scope.calibrate();
      for (const res of results) {
        this.log.info(res);
      }
    });

    // When the light turns on/off, turn steppers off/on
    mute.status.on("change", async () => {
      await scope.setSteppers(!mute.status.state);
    });
  }
}

async function main() {
  const noskop = new Noskop();
  await noskop.setup();
}

await main();
