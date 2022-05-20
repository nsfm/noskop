import { Dualsense } from "dualsense-ts";
import winston from "winston";

import { Scope } from "./scope";

class Noskop {
  private scope: Scope = new Scope();
  private controller: Dualsense = new Dualsense();
  private logger = winston.createLogger({
    level: "debug",
    format: winston.format.prettyPrint(),
  });

  constructor() {
    this.jingle();
  }

  jingle(): void {
    this.scope.tone(50, 450);
    this.scope.deployProbe();
    this.scope.tone(100, 600);
    this.scope.stowProbe();
  }

  bindControls() {
    this.controller.ps.on("change", () => {
      process.exit(0);
    });

    this.controller.triangle.on("change", () => {
      this.scope.getEndstopStates();
    });

    this.controller.circle.on("change", (input) => {
      if (input.state === false) return;
      if (this.scope.steppersEnabled) {
        this.scope.steppersOff();
      } else {
        this.scope.steppersOn();
      }
    });
  }
}

function main() {
  const noskop = new Noskop();
  noskop.jingle();
  noskop.bindControls();
}

main();
