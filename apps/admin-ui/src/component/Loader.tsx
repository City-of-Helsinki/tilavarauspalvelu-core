import React from "react";
import styled from "styled-components";
import { LoadingSpinner } from "hds-react";

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 4em;
`;

function Loader(): JSX.Element {
  return (
    <Wrapper>
      <LoadingSpinner />
    </Wrapper>
  );
}

export default Loader;
