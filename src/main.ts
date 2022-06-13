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
    this.log.info("Setup complete");
  }
}

async function main() {
  const noskop = new Noskop();
  await noskop.setup();
}

await main();
