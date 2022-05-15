import { Dualsense } from "dualsense-ts";

export function main() {
  const controller = new Dualsense();
  controller.triangle.on("change", () => {
    process.exit(0);
  });
}

main();
