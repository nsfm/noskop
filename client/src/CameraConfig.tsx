import {
  Menu,
  MenuItem,
  MenuDivider,
  Card as BCard,
  Elevation,
} from "@blueprintjs/core";
import styled from "styled-components";

const Card = styled(BCard)`
  opacity: 0.5;
  grid-column: -2;
  grid-row: 1;
`;

type ConfigProps = {
  activeDevice?: string;
  setActiveDevice: (deviceId: string) => void;
  devices: MediaDeviceInfo[];
};

export const CameraConfig = ({
  activeDevice,
  setActiveDevice,
  devices,
}: ConfigProps) => {
  const validDevices = devices.filter(({ deviceId }) => deviceId !== "");
  return (
    <Card elevation={Elevation.TWO}>
      <Menu>
        <MenuDivider title="camera" />
        {validDevices.map(({ label, deviceId }) => (
          <MenuItem
            text={label}
            icon={deviceId === activeDevice ? "eye-open" : "eye-off"}
            intent={deviceId === activeDevice ? "primary" : "warning"}
            onClick={() => setActiveDevice(deviceId)}
          />
        ))}
      </Menu>
    </Card>
  );
};
