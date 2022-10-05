import React from "react";
import { Illustration } from "react-zdog";

import { Reticle } from "./Reticle";
import "./HUD.css";

export const HUD = () => {
  return (
    <div className="hud">
      <Illustration element="svg" zoom={15}>
        <Reticle />
      </Illustration>
    </div>
  );
};
