import { useState, useContext, useEffect } from "react";
import styled from "styled-components";
import { Illustration, Ellipse, Shape } from "react-zdog";

import { RenderedElement } from "./RenderedElement";
import { ControllerContext } from "../Controller";

interface InventoryState {
  diameter: number;
  thickness: number;
  zoom: number;
}

const StyledInventory = styled(RenderedElement)`
  overflow: hidden;
  grid-column: 1;
  grid-row: 6;
  display: flex;
  align-items: flex-end;
  justify-content: left;
`;

/**
 */
export const Inventory = () => {
  const controller = useContext(ControllerContext);
  const [{ direction, magnitude }, setAnalog] = useState(
    controller.left.analog.vector
  );
  useEffect(() => {
    controller.left.analog.on("change", (analog) => {
      setAnalog(analog.vector);
    });
  }, []);

  console.log(`Inventory: ${direction} x ${magnitude}`);

  const [state] = useState<InventoryState>({
    diameter: 20,
    thickness: 1,
    zoom: 15,
  });

  const outerDiameter = state.diameter + state.diameter / 2;
  const maxDimension = (outerDiameter / 2 + state.thickness) * state.zoom;
  return (
    <StyledInventory width={maxDimension} height={maxDimension}>
      <Illustration element="svg" zoom={state.zoom}>
        <Shape
          stroke={0}
          translate={{
            x: -state.diameter / 2 - state.thickness,
            y: state.diameter / 2 + state.thickness,
          }}
        >
          <Ellipse
            stroke={state.thickness}
            diameter={state.diameter}
            color="orange"
            quarters={1}
          />
          <Ellipse
            stroke={state.thickness / 4}
            diameter={outerDiameter}
            color="orange"
            quarters={1}
          />
        </Shape>
      </Illustration>
    </StyledInventory>
  );
};
