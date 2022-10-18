import React from "react";
import { Illustration, Ellipse, Shape } from "react-zdog";

import { HUDElement } from "./HUDElement";
import { ControllerContext } from "../Controller";

interface ReticleState {
  opacity: number;
  diameter: number;
  thickness: number;
  parallax: number;
  zoom: number;
}

/**
 * Focal point of the main camera image
 */
export const Reticle = () => {
  const controller = React.useContext(ControllerContext);
  const [{ direction, magnitude }, setAnalog] = React.useState(
    controller.left.analog.vector
  );
  React.useEffect(() => {
    controller.left.analog.on("change", (analog) => {
      setAnalog(analog.vector);
    });
  }, []);

  console.log(`Reticle: ${direction} x ${magnitude}`);

  const [state] = React.useState<ReticleState>({
    opacity: 0.7,
    diameter: 5,
    thickness: 0.25,
    parallax: 0.1,
    zoom: 15,
  });

  return (
    <HUDElement
      width={state.diameter * state.zoom * 1.25}
      height={(state.diameter + state.parallax) * state.zoom}
    >
      <Illustration element="svg" zoom={state.zoom}>
        <Shape
          rotate={{
            y: Math.sin(direction),
            x: Math.cos(magnitude),
          }}
          stroke={0}
        >
          <Ellipse
            stroke={state.thickness}
            diameter={state.diameter}
            color="orange"
          />
          <Ellipse
            stroke={state.thickness}
            diameter={state.diameter}
            color="blue"
            translate={{ x: magnitude, y: state.parallax, z: -1 }}
          />
        </Shape>
      </Illustration>
    </HUDElement>
  );
};
