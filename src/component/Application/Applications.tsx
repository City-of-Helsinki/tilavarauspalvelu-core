import React from "react";
import styled from "styled-components";
import withMainMenu from "../withMainMenu";
import Heading from "./Heading";

const Wrapper = styled.div`
  width: 100%;
`;

function Applications(): JSX.Element | null {
  return (
    <Wrapper>
      <Heading />
      Applications
    </Wrapper>
  );
}

export default withMainMenu(Applications);
