import { Dualsense } from "dualsense-ts";

import { Scope } from "./scope";

class Noskop {
  controller = new Dualsense();
  scope = new Scope();
}

export function main() {
  const noskop = new Noskop();
  noskop.controller.triangle.on("change", () => {
    process.exit(0);
  });
}

main();
