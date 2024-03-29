import { Service } from "typedi";

import { ControllerService } from "./controller";
import { LogService, Logger } from "./log";
import { ScopeService } from "./scope";
import { movementConfig } from "../config";

/**
 * Configures and coordinates the other components, providing an
 * entry point for the tool.
 */
@Service()
export class Noskop {
  private log: Logger;

  constructor(
    public controller: ControllerService,
    public scope: ScopeService,
    log: LogService
  ) {
    this.log = log.spawn("noskop");
  }

  async setup(): Promise<void> {
    await this.scope.scope.setMechanics(movementConfig);
    this.bindControls();
    this.log.info("Setup complete");
  }

  /**
   * Assigns other controller actions
   */
  bindControls() {
    const {
      scope,
      controller: {
        controller: { ps, triangle, cross, mute },
      },
    } = this;

    ps.on("press", async () => {
      await scope.shutdown();
      process.exit(0);
    });

    cross.on("press", async () => {
      const res = await scope.scope.getEndstopStates();
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
      await scope.scope.setSteppers(!mute.status.state);
    });
  }
}
