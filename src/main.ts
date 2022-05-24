import { Dualsense } from "dualsense-ts";
import Logger from "bunyan";

import { Scope } from "./scope";

export type Millimeters = number;

class Noskop {
  private moving: boolean = false;
  private moveRate: number = 15; // times per second
  private maxMove: Millimeters = 10; // largest allowed travel increment
  private invert = {
    x: false,
    y: true,
    z: false,
    e: false,
  };

  private log = Logger.createLogger({
    level: "debug",
    name: "noskop",
  });

  public scope: Scope = new Scope({
    logger: this.log,
    debug: false,
    commandRate: 60,
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
    }, 1000 / this.moveRate);
    this.log.info("Setup complete");
  }

  get boost(): boolean {
    return this.controller.circle.state;
  }

  async checkMove(): Promise<void> {
    if (this.controller.left.analog.magnitude < 1) return;
    if (this.scope.busy()) return;

    return this.moveStage(
      this.controller.left.analog.x.state / 128,
      this.controller.left.analog.y.state / 128
    );
  }

  async moveStage(x: Millimeters, y: Millimeters): Promise<void> {
    if (this.moving) return;
    this.log.debug(`Moving: X${x} Y${y}`);
    this.moving = true;
    const boost = this.boost ? 20 : 1;
    const setMode = this.scope.relativeMode();
    const move = this.scope.linearMove({
      x: (this.invert.x ? -1 : 1) * Math.min(x, this.maxMove) * boost,
      y: (this.invert.y ? -1 : 1) * Math.min(y, this.maxMove) * boost,
      z: 0,
      e: 0,
    });
    await setMode;
    await move;
    await this.scope.finish();
    this.moving = false;
  }

  bindControls() {
    this.controller.ps.on("change", async (input) => {
      if (input.state === false) return;
      await this.scope.shutdown();
      process.exit(0);
    });

    this.controller.triangle.on("change", async (input) => {
      if (input.state === false) return;
      const res = await this.scope.getEndstopStates();
      this.log.info(`Endstops: ${res.response || "err"}`);
    });

    this.controller.mute.on("change", async (input) => {
      if (input.state === false) return;
      await this.scope.setSteppers(!this.scope.steppersEnabled);
    });

    this.controller.dpad.on("change", async (dpad, input) => {
      if (!dpad.active || input.state === false) return;

      switch (input.id) {
        case this.controller.dpad.up.id:
          return this.moveStage(0, 1);
        case this.controller.dpad.down.id:
          return this.moveStage(0, -1);
        case this.controller.dpad.left.id:
          return this.moveStage(1, 0);
        case this.controller.dpad.right.id:
          return this.moveStage(-1, 0);
      }
    });
  }
}

async function main() {
  const noskop = new Noskop();
  await noskop.setup();
}

await main();
