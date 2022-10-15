import React from "react";
import styled from "styled-components";

import { MainCamera } from "./MainCamera";
import { HUD } from "./hud/HUD";
import { ControllerContext, controller } from "./Controller";

const MainContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  background-color: #282c34;
`;

export const Noskop = () => {
  return (
    <MainContainer>
      <MainCamera>
        <ControllerContext.Provider value={controller}>
          <HUD />
        </ControllerContext.Provider>
      </MainCamera>
    </MainContainer>
  );
};
