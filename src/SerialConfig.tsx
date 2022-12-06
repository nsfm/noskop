import { Menu, MenuItem, MenuDivider, FormGroup } from "@blueprintjs/core";

import { useSerial } from "./Serial";

export const SerialConfig = () => {
  const { canUseSerial, hasTriedAutoconnect, connect, disconnect, portState } =
    useSerial();

  return (
    <FormGroup>
      <Menu>
        <MenuDivider title="serial" />
        <MenuItem
          text={`webserial available: ${canUseSerial ? "yes" : "no"}`}
          icon={canUseSerial ? "endorsed" : "cross-circle"}
          intent={canUseSerial ? undefined : "warning"}
        />
        <MenuItem
          hidden={!canUseSerial}
          text={`port status: ${portState}${
            hasTriedAutoconnect ? " (auto-connect failed)" : ""
          }`}
          icon={portState === "open" ? "heart" : "heart-broken"}
          intent={portState === "open" ? "primary" : "warning"}
        >
          <MenuItem text={"connect"} icon={"plus"} onClick={connect} />
          <MenuItem text={"disconnect"} icon={"minus"} onClick={disconnect} />
        </MenuItem>
      </Menu>
    </FormGroup>
  );
};
