import React from "react";
import { Dualsense } from "dualsense-ts";

export const controller = new Dualsense();
controller.connection.on("change", ({ state }) => {
  console.group("dualsense-ts");
  console.log(`Controller ${state ? "" : "dis"}connected`);
  console.groupEnd();
});
export const ControllerContext = React.createContext(controller);
ControllerContext.displayName = "ControllerContext";
