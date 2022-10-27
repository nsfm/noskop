import { Menu, MenuItem, MenuDivider, FormGroup } from "@blueprintjs/core";

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
    <FormGroup>
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
    </FormGroup>
  );
};
