import React from "react";
import { Ellipse, Shape } from "react-zdog";

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
  const [state] = React.useState<ReticleState>({
    offset: { x: 0, y: 0 },
    opacity: 0.7,
    diameter: 5,
    thickness: 0.25,
    parallax: 0.1,
  });

  return (
    <Shape rotate={{ y: Math.PI / 8, x: Math.PI / 8 }} stroke={0}>
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
