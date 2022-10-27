import React from "react";

import { Objective } from "./Objective";

/**
 * Represents the objective lens turret. Manages selection and order
 * of objective lenses.
 */
export const Turret = () => {
  const [size, setSize] = React.useState<number>();
  const [objectives, setObjectives] = React.useState<typeof Objective[]>([]);
  const [activeObjective, setActiveObjective] = React.useState<number>(0);

  return <div />;
};
