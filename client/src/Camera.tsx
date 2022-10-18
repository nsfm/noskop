import { useEffect, useState, useCallback, PropsWithChildren } from "react";
import Webcam from "react-webcam";
import styled from "styled-components";

const CamContainer = styled.div`
  position: relative;
  display: inline-flex;
  height: 100%;
  width: min-content;
  overflow: hidden;
  background-color: #000000;
`;

const Placeholder = styled.div`
  display: inline-flex;
  height: 100vh;
  width: 100vw;
  background-color: cornsilk;
`;

/**
 * Container for main webcam display, which passes the
 */
export const Camera = ({ children }: PropsWithChildren) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

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

  return (
    <CamContainer className="MainCamera">
      {devices.length ? (
        <Webcam
          height="100%"
          key={devices[devices.length - 1].deviceId}
          audio={false}
          videoConstraints={{
            deviceId: devices[devices.length - 1].deviceId,
            frameRate: { min: 30, ideal: 60 },
          }}
        />
      ) : (
        <Placeholder>Waiting for a webcam...</Placeholder>
      )}

      {devices.length ? children : []}
    </CamContainer>
  );
};
