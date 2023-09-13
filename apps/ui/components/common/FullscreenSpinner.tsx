import React from "react";
import styled from "styled-components";
import { LoadingSpinner } from "hds-react";

const Wrapper = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  inset: 0;
  z-index: 300;
`;

const StyledLoadingSpinner = styled(LoadingSpinner)`
  position: absolute;
  left: 48%;
  top: 40%;
`;

export const FullscreenSpinner = (): JSX.Element => {
  return (
    <Wrapper>
      <StyledLoadingSpinner />
    </Wrapper>
  );
};
