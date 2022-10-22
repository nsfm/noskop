import { useEffect, useState, useCallback, PropsWithChildren } from "react";
import { NonIdealState } from "@blueprintjs/core";
import Webcam from "react-webcam";
import styled from "styled-components";

import { HUDLayout } from "./hud";
import { CameraConfig } from "./CameraConfig";
import { Spinner } from "./Spinner";

const CamContainer = styled.div`
  position: relative;
  display: inline-flex;
  height: 100%;
  width: min-content;
  overflow: hidden;
  background-color: #000000;
`;

const Placeholder = styled(NonIdealState)`
  display: inline-flex;
  height: 100%;
  width: 100vw;
  background-color: #000000;
`;

/**
 * Container for main webcam display, which passes the
 */
export const Camera = ({ children }: PropsWithChildren) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDevice, setActiveDevice] = useState<string>();

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices]
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  console.group("Webcam");
  devices.map((device) => device.toJSON()).forEach(console.log);
  console.groupEnd();

  const validDevices = devices.filter(({ deviceId }) => deviceId !== "");
  if (!activeDevice && validDevices.length) {
    setActiveDevice(validDevices[validDevices.length - 1].deviceId);
  }

  return (
    <CamContainer className="Camera">
      {validDevices.length ? (
        <Webcam
          height="100%"
          key={validDevices[validDevices.length - 1].deviceId}
          audio={false}
          videoConstraints={{
            deviceId: activeDevice,
            frameRate: { min: 30, ideal: 60 },
          }}
        />
      ) : (
        <Placeholder
          icon={<Spinner />}
          title="no video"
          description="please connect a camera and double check permissions"
        />
      )}
      {validDevices.length ? (
        <HUDLayout>
          <CameraConfig
            activeDevice={activeDevice}
            setActiveDevice={setActiveDevice}
            devices={devices}
          />
          {children}
        </HUDLayout>
      ) : (
        []
      )}
    </CamContainer>
  );
};
