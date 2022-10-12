import React from "react";

import { MainCamera } from "./MainCamera";
import { HUD } from "./hud/HUD";
import { ControllerContext, controller } from "./Controller";
import "./Noskop.css";

export const Noskop = () => {
  return (
    <div className="noskop">
      <ControllerContext.Provider value={controller}>
        <MainCamera>
          <HUD />
        </MainCamera>
      </ControllerContext.Provider>
    </div>
  );
};
