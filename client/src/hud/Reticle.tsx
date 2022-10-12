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
  const [analog, setAnalog] = React.useState(controller.left.analog);
  React.useEffect(() => {
    console.log("seEffect");
    controller.left.analog.on("change", (an) => {
      console.log(an.angle, an.magnitude);
      setAnalog(an);
    });
  }, []);

  console.log(`Reticle: ${analog.angle} ${analog.magnitude}`);

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
        y: Math.sin(analog.angle),
        x: Math.cos(analog.angle),
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
        translate={{ x: state.parallax, y: state.parallax, z: -1 }}
      />
    </Shape>
  );
};
