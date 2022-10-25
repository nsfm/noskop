import {
  useState,
  MouseEventHandler,
  PropsWithChildren,
  Children,
} from "react";
import {
  Overlay,
  Classes,
  Icon,
  Card as BCard,
  Elevation,
} from "@blueprintjs/core";
import styled from "styled-components";

const Position = styled.div`
  opacity: 0.5;
  display: flex;
  justify-content: "right";
  align-items: "top";
  grid-column: -2;
  grid-row: 1;
  padding: 1vw;
`;

const Card = styled(BCard)`
  opacity: 0.9;
`;

const Container = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 2vh;
  padding: 2vh;
`;

export const useConfig = () => {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen: MouseEventHandler = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const toggle = () => (
    <Position>
      <Icon onClick={handleOpen} icon="cog" />
    </Position>
  );
  const overlay = ({ children }: PropsWithChildren) => (
    <Overlay
      isOpen={open}
      lazy={false}
      onClose={handleClose}
      className={Classes.OVERLAY_SCROLL_CONTAINER}
    >
      <Container>
        {Children.map(children, (child) => (
          <Card elevation={Elevation.TWO}>{child}</Card>
        ))}
      </Container>
    </Overlay>
  );

  return [toggle, overlay];
};
