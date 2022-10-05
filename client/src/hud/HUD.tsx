import React from "react";
import { Illustration } from "react-zdog";

import { Reticle } from "./Reticle";
import { Scale } from "./Scale";
import "./HUD.css";

export const HUD = () => {
  return (
    <div className="hud">
      <Illustration element="svg" zoom={15}>
        <Reticle />
        <Scale direction="x" offset={{ y: -15 }} width={30} />
        <Scale direction="y" offset={{ x: -15 }} width={20} ticks={21} />
      </Illustration>
    </div>
  );
};
