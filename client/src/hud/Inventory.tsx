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

interface StyledInventoryProps {
  width: number;
  height: number;
}

const StyledInventory = styled(RenderedElement)``;

const StyledInventoryContainer = styled.div<StyledInventoryProps>`
  overflow: hidden;
  grid-column: 1 / span 2;
  grid-row: 5 / span 2;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  div > div > svg {
    overflow: visible;
    margin-left: ${({ width }) => `-${width / 2 - 15}px`};
    margin-top: 50%;
  }
    
  }
`;

/**
 * Focal point of the main camera image
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

  return (
    <StyledInventoryContainer
      width={
        (state.diameter + state.diameter / 2 + state.thickness) * state.zoom
      }
      height={
        (state.diameter + state.diameter / 2 + state.thickness) * state.zoom
      }
    >
      <StyledInventory
        width={
          (state.diameter + state.diameter / 2 + state.thickness) * state.zoom
        }
        height={
          (state.diameter + state.diameter / 2 + state.thickness) * state.zoom
        }
      >
        <Illustration element="svg" zoom={state.zoom}>
          <Shape stroke={0}>
            <Ellipse
              stroke={state.thickness}
              diameter={state.diameter}
              color="orange"
            />
            <Ellipse
              stroke={state.thickness / 4}
              // quarters={1}
              diameter={state.diameter + state.diameter / 2}
              color="orange"
            />
          </Shape>
        </Illustration>
      </StyledInventory>
    </StyledInventoryContainer>
  );
};
