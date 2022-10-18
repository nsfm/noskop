import { useEffect, useState, useContext } from "react";
import { Illustration, Ellipse } from "react-zdog";
import styled from "styled-components";

import { RenderedElement } from "./RenderedElement";
import { ControllerContext, requestPermission } from "../Controller";

const Button = styled.button`
  display: inline-block;
  vertical-align: middle;
  margin-left: 5px;
`;

const Position = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  top: 10%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.7;
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
  const controller = useContext(ControllerContext);
  const [connected, setConnected] = useState(controller.connection.state);
  const [rotation, setRotation] = useState(0);
  useEffect(() => {
    setInterval(() => setRotation((Date.now() / 2000) % Math.PI), 1000 / 30);
    controller.connection.on("change", ({ state }) => {
      setConnected(state);
    });
  }, []);

  const [state] = useState<ControllerConnectionState>({
    offset: { x: 0, y: 0 },
    opacity: 0.7,
    diameter: 2,
    thickness: 0.25,
    parallax: 0.1,
    zoom: 15,
  });

  return (
    <Position>
      <RenderedElement
        width={(state.diameter + state.thickness) * state.zoom}
        height={(state.diameter + state.thickness) * state.zoom}
      >
        <Illustration element="svg" zoom={state.zoom}>
          <Ellipse
            rotate={{ y: rotation }}
            stroke={state.thickness}
            diameter={state.diameter}
            color={connected ? "orange" : "blue"}
            translate={{ x: 0, y: 0 }}
          />
        </Illustration>
      </RenderedElement>
      <Button onClick={requestPermission}>Connect&nbsp;Controller</Button>
    </Position>
  );
};
