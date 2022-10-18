import React from "react";
import { Illustration, Ellipse } from "react-zdog";
import styled from "styled-components";

import { HUDElement } from "./HUDElement";
import { ControllerContext, requestPermission } from "../Controller";

const Button = styled.button`
  position: absolute;
  top: -50;
  left: 50;
  z-index: 15;
`;

interface ControllerConnectionState {
  offset: { x: number; y: number };
  opacity: number;
  diameter: number;
  thickness: number;
  parallax: number;
  zoom: number;
}

export const ControllerConnection = () => {
  const controller = React.useContext(ControllerContext);
  const [connected, setConnected] = React.useState(controller.connection.state);
  React.useEffect(() => {
    controller.connection.on("change", ({ state }) => {
      setConnected(state);
    });
  }, []);

  const [state] = React.useState<ControllerConnectionState>({
    offset: { x: 0, y: 0 },
    opacity: 0.7,
    diameter: 5,
    thickness: 0.25,
    parallax: 0.1,
    zoom: 15,
  });


  const svg = (
  <HUDElement width={20} height={30}>
    <Illustration element="svg" zoom={state.zoom}>
      <Ellipse
        stroke={1}
        diameter={3}
        color={connected ? "orange" : "blue"}
        onClick={requestPermission}
        translate={{x: 0, y: 0}}
      />
    </Illustration>
    </HUDElement>
  );

  return svg;
};
