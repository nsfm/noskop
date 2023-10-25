import React from "react";
import { Dualsense, WebHIDProvider } from "dualsense-ts";

export const controller = new Dualsense();
export const requestPermission = (
  controller.hid.provider as WebHIDProvider
).getRequest();

export const ControllerContext = React.createContext(controller);
ControllerContext.displayName = "ControllerContext";

controller.hid.register((data) => {
  console.group("dualsense-ts");
  controller.hid.provider.setWired()
  console.log(JSON.stringify(controller.hid.state, null, 2))
  console.log(controller.hid.provider.wireless)
  console.groupEnd();
})

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
