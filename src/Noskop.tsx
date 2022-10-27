import styled from "styled-components";
import { MouseEvent } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";

import { useConfig } from "./config";
import { Reticle, ControllerConnection, Inventory } from "./hud";
import { Objective } from "./mechanics";
import { useCamera } from "./Camera";
import { ControllerContext, controller } from "./Controller";

const AppContainer = styled.div`
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

  const [ConfigToggle, ConfigOverlay] = useConfig();
  const [Camera, CameraConfig] = useCamera();

  return (
    <ControllerContext.Provider value={controller}>
      <FullScreen handle={fullscreen}>
        <AppContainer className="AppContainer">
          <Camera>
            <Reticle />
            <ControllerConnection />
            <Inventory />
            <ConfigToggle />
          </Camera>
          <ConfigOverlay>
            <CameraConfig />
            <Objective />
          </ConfigOverlay>
        </AppContainer>
      </FullScreen>
    </ControllerContext.Provider>
  );
};
