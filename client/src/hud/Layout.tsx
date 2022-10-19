import styled from "styled-components";

export const HUDLayout = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 10;
  top: 0;
  margin: auto;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 1fr 30% 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
`;
