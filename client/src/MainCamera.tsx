import React from "react";
import Webcam from "react-webcam";
import styled from "styled-components";

const MainCamContainer = styled.div`
  .maincamera {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
  }
`;

export const MainCamera = ({ children }: React.PropsWithChildren<{}>) => {
  const [devices, setDevices] = React.useState<MediaDeviceInfo[]>([]);

  const handleDevices = React.useCallback(
    (mediaDevices: MediaDeviceInfo[]) =>
      setDevices(mediaDevices.filter(({ kind }) => kind === "videoinput")),
    [setDevices]
  );

  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  return (
    <MainCamContainer>
      {
        <Webcam
          key={devices[0].deviceId}
          audio={false}
          videoConstraints={{ deviceId: devices[0].deviceId }}
        />
      }
      {children}
    </MainCamContainer>
  );
};
