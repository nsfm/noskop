import { PropsWithChildren } from "react";
import styled from "styled-components";
import { Illustration } from "react-zdog";

const HUDContainer = styled.div`
  position: absolute;
  opacity: 0.7;
  z-index: 10;
  top: 0;
  margin: auto;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

/**
 * Container for rendered svg HUD elements
 */
export const HUD = ({ children }: PropsWithChildren) => {
  return (
    <HUDContainer>
      <Illustration element="svg" zoom={15}>
        {children}
      </Illustration>
    </HUDContainer>
  );
};
