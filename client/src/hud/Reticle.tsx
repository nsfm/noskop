import React from "react";
import { useRender, useZdog, Shape } from "react-zdog";

interface ReticleState {
  offset: { x: number; y: number };
  opacity: number;
  diameter: number;
}

/**
 * Represents the focal point of the main camera image. Manipulators should be centered on this point.
 */
export const Reticle = () => {
  const [state, setState] = React.useState<ReticleState>({
    offset: { x: 0, y: 0 },
    opacity: 0.7,
    diameter: 0.1,
  });

  return <Shape stroke={10} color="orange" />;
};
