import styled from "styled-components";
import { MouseEvent } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { MainCamera } from "./MainCamera";
import { HUD, Reticle, ControllerConnection } from "./hud";
import { ControllerContext, controller } from "./Controller";

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #000000;
`;

/**
 * Container for the entire app
 */
export const Noskop = () => {
  const fullscreen = useFullScreenHandle();

  // Click to enter full screen, double click to leave
  const toggleFullscreen = (event: MouseEvent) => {
    switch (event.detail) {
      case 1:
        if (!fullscreen.active) fullscreen.enter();
        break;
      case 2:
        fullscreen.exit();
        break;
    }
  };

  return (
    <ControllerContext.Provider value={controller}>
      <FullScreen handle={fullscreen}>
        <MainContainer onClick={toggleFullscreen}>
          <MainCamera />
          <HUD>
            <Reticle />
            <ControllerConnection />
          </HUD>
        </MainContainer>
      </FullScreen>
    </ControllerContext.Provider>
  );
};
