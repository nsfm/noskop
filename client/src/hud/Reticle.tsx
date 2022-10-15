import React from "react";
import { Ellipse, Shape } from "react-zdog";

import { ControllerContext } from "../Controller";

interface ReticleState {
  offset: { x: number; y: number };
  opacity: number;
  diameter: number;
  thickness: number;
  parallax: number;
}

/**
 * Represents the focal point of the main camera image. Manipulators should be centered on this point.
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
    offset: { x: 0, y: 0 },
    opacity: 0.7,
    diameter: 5,
    thickness: 0.25,
    parallax: 0.1,
  });

  return (
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
  );
};
