import React from "react";

interface CompassState {
  opacity: number;
}

/**
 * Displays the relative position of nearby Waypoints
 */
export const Compass = () => {
  const [state, setState] = React.useState<CompassState>({ opacity: 0.7 });
};
