import React from "react";
import Webcam from "react-webcam";
import styled from "styled-components";

const MainCamContainer = styled.div`
  display: inline-flex;
  height: 100%;
  width: min-content;
  overflow: hidden;
  background-color: #000000;
`;

/**
 * Container for main webcam display
 */
export const MainCamera = () => {
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);

  const handleDevices = React.useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices]
  );

  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  console.group("Webcam");
  console.log(devices.map((device) => device.toJSON()));
  console.groupEnd();

  return (
    <MainCamContainer>
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
        <div>Waiting for a webcam...</div>
      )}
    </MainCamContainer>
  );
};
