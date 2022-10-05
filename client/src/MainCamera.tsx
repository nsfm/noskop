import React from "react";
import Webcam from "react-webcam";

import "./MainCamera.css";

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
    <>
      {devices.map((device) => (
        <Webcam
          className="maincamera"
          audio={false}
          videoConstraints={{ deviceId: device.deviceId }}
        />
      ))}
      {children}
    </>
  );
};
