import React from "react";
import { Ellipse } from "react-zdog";

import { ControllerContext, requestPermission } from "../Controller";
import "./ControllerConnection.css";

export const ControllerConnection = () => {
  const controller = React.useContext(ControllerContext);
  const [connected, setConnected] = React.useState(controller.connection.state);
  React.useEffect(() => {
    controller.connection.on("change", ({ state }) => {
      setConnected(state);
    });
  }, []);

  const translate = { x: 30, y: -30 };

  const svg = (
    <Ellipse
      stroke={1}
      diameter={3}
      color={connected ? "orange" : "blue"}
      onClick={requestPermission}
      translate={translate}
    />
  );

  return svg;
};
