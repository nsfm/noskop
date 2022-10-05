import React from "react";

import { MainCamera } from "./MainCamera";
import { HUD } from "./hud/HUD";
import "./Noskop.css";

export const Noskop = () => {
  return (
    <div className="noskop">
      <MainCamera>
        <HUD />
      </MainCamera>
    </div>
  );
};
