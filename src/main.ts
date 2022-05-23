import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { CoordinateSet } from "./marlin";
import { Scope } from "./scope";

class Noskop {
  private log = Logger.createLogger({
    level: "debug",
    name: "noskop",
  });

  public scope: Scope = new Scope({ logger: this.log, debug: false });
  public controller: Dualsense = new Dualsense();

  async setup(): Promise<void> {
    await this.scope.setup();
    this.bindControls();
    setInterval(() => {
      //this.render();
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
    });

    this.controller.dpad.on("change", async (dpad, input) => {
      if (input.state === false) return;
      const moves: { [key: symbol]: CoordinateSet } = {
        [this.controller.dpad.up.id]: { x: 0, y: 1, z: 0, e: 0 },
        [this.controller.dpad.down.id]: { x: 0, y: -1, z: 0, e: 0 },
        [this.controller.dpad.left.id]: { x: -1, y: 0, z: 0, e: 0 },
        [this.controller.dpad.right.id]: { x: 1, y: 0, z: 0, e: 0 },
      };

      if (input.id in moves) {
        await this.scope.relativeMode();
        await this.scope.linearMove(moves[input.id]);
      }
    });
  }
}

async function main() {
  const noskop = new Noskop();
  await noskop.setup();
}

await main();
