import React from "react";
import { Illustration, Anchor, useZdog, useRender } from "react-zdog";

import { Reticle } from "./Reticle";
import { GraduatedRule } from "./GraduatedRule";
import "./HUD.css";

/**
 * Positions and scales the graduated rulers at the top and bottom of the screen.
 */
export const HUDRule = () => {
  const { size } = useZdog();
  const [{ height, width }] = React.useState(size);

  const ref = React.useRef<typeof Anchor>();

  const refX = React.useRef(
    <GraduatedRule
      direction="x"
      offset={{ y: (height / 2) * -0.8 }}
      length={width * 0.8}
      gradation={{
        count: 31,
        length: width / 100,
        thickness: width / 100,
      }}
    />
  );

  useRender(() => {
    if (ref.current) ref.current.rotate.z += 0.01;
  });

  React.useEffect(() => {
    const handleResize = () => {
      console.log("resize", size);
    };

    window.addEventListener("resize", handleResize);
  });

  console.log(size);
  return (
    <Anchor ref={ref}>
      {refX.current}
      <GraduatedRule
        direction="y"
        offset={{ x: (width / 2) * -0.8 }}
        length={height * 0.8}
        gradation={{
          count: 31,
          length: width / 100,
          thickness: width / 100,
        }}
      />
    </Anchor>
  );
};

export const HUD = () => {
  return (
    <div className="hud">
      <Illustration element="svg" zoom={10}>
        <Reticle />
      </Illustration>
    </div>
  );
};
