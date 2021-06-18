import React from 'react';
import { Koros } from 'hds-react';
import styled from 'styled-components';

interface HeadProps {
  heading: string;
  text: string;
}

const Container = styled.div`
  background-color: var(--tilavaraus-header-background-color);
`;
const Content = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
`;
const H1 = styled.h1`
  font-size: var(--fontsize-heading-xl);
`;
const StyledKoros = styled(Koros)`
  fill: var(--tilavaraus-gray);
`;

const Head = (props: HeadProps): JSX.Element => (
  <Container>
    <Content>
      <H1>{props.heading}</H1>
      <span>{props.text}</span>
    </Content>
    <StyledKoros className="koros" type="wave" />
  </Container>
);

export default Head;
