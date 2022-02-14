import React from "react";
import styled from "styled-components";
import KorosPulseEasy from "../common/KorosPulseEasy";

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

const Head = ({ heading }: Props): JSX.Element => {
  return (
    <Container>
      <Content>
        <Heading>{heading}</Heading>
      </Content>
      <KorosPulseEasy
        from="var(--tilavaraus-hero-background-color)"
        to="var(--tilavaraus-gray)"
      />
    </Container>
  );
};

export default Head;
