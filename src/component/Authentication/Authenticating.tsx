import React from "react";
import styled from "styled-components";
import { LoadingSpinner } from "hds-react";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 70vh;
`;

function Authenticating(): JSX.Element {
  return (
    <Wrapper>
      <LoadingSpinner />
    </Wrapper>
  );
}

export default Authenticating;
