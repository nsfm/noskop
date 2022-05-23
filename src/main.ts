import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { CoordinateSet } from "./marlin";
import { Scope } from "./scope";

class Noskop {
  private log = Logger.createLogger({
    level: "debug",
    name: "noskop",
  });

  public scope: Scope = new Scope({
    logger: this.log,
    debug: false,
    commandRate: 30,
  });
  public controller: Dualsense = new Dualsense();

  async setup(): Promise<void> {
    await this.scope.setup();
    this.bindControls();
    setInterval(() => {
      this.checkMove()
        .then(() => {
          //
        })
        .catch((err) => {
          this.log.error(err);
        });
    }, 1000 / 15);
    this.log.info("Setup complete");
  }

  render(): void {
    this.log.debug(`Steppers: ${this.scope.steppersEnabled ? "off" : "on"}`);
  }

  async checkMove(): Promise<void> {
    if (this.scope.busy()) return;
    if (
      this.controller.left.analog.x.magnitude / 128 < 0.05 &&
      this.controller.left.analog.y.magnitude / 128 < 0.05
    )
      return;

    await this.scope.relativeMode();
    const boost = this.controller.circle.state ? 20 : 6;
    await this.scope.linearMove({
      x: (this.controller.left.analog.x.state / 128) * boost,
      y: -1 * (this.controller.left.analog.y.state / 128) * boost,
      z: 0,
      e: 0,
    });
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

    this.controller.mute.on("change", async (input) => {
      if (input.state === false) return;
      await this.scope.setSteppers(!this.scope.steppersEnabled);
    });

    this.controller.dpad.on("change", async (dpad, input) => {
      if (input.state === false) return;
      const boost = this.controller.circle.state;
      const distance = boost ? 5 : 1;
      const moves: { [key: symbol]: CoordinateSet } = {
        [this.controller.dpad.up.id]: { x: 0, y: distance, z: 0, e: 0 },
        [this.controller.dpad.down.id]: { x: 0, y: -distance, z: 0, e: 0 },
        [this.controller.dpad.left.id]: { x: -distance, y: 0, z: 0, e: 0 },
        [this.controller.dpad.right.id]: { x: distance, y: 0, z: 0, e: 0 },
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
