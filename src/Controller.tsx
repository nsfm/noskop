import React from "react";
import { Dualsense, WebHIDProvider } from "dualsense-ts";

export const controller = new Dualsense();
export const requestPermission = (
  controller.hid.provider as WebHIDProvider
).getRequest();

export const ControllerContext = React.createContext(controller);
ControllerContext.displayName = "ControllerContext";

controller.connection.on("change", ({ state }) => {
  console.group("dualsense-ts");
  console.log(`Controller ${state ? "" : "dis"}connected`);
  console.groupEnd();
});

controller.hid.on("error", (err) => {
  console.group("dualsense-ts");
  console.log(err);
  console.groupEnd();
});
