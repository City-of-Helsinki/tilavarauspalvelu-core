import React from "react";
import { Koros } from "hds-react";
import styled from "styled-components";

type Props = {
  heading: string;
};

const Heading = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const Container = styled.div`
  background-color: var(--tilavaraus-hero-background-color);
  color: var(--color-white);
`;

const Content = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto;
  font-size: var(--fontsize-heading-m);
`;

const StyledKoros = styled(Koros)`
  background-color: var(--tilavaraus-gray);
  fill: var(--tilavaraus-hero-background-color);
`;

const Head = ({ heading }: Props): JSX.Element => {
  return (
    <Container>
      <Content>
        <Heading>{heading}</Heading>
      </Content>
      <StyledKoros flipHorizontal className="koros" type="pulse" />
    </Container>
  );
};

export default Head;
