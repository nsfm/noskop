import { Illustration } from "react-zdog";

import { Reticle } from "./Reticle";

export const HUD = () => {
  return (
    <Illustration element="svg" zoom={15}>
      <Reticle />
    </Illustration>
  );
};
