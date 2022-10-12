import React from "react";
import styled from "styled-components";
import { fontRegular, H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import Container from "../common/Container";

interface HeadProps {
  heading: string;
  text: string;
}

const Wrapper = styled.div`
  width: 100%;
  color: var(--color-black);
  font-size: var(--fontsize-heading-s);
`;

const Content = styled(Container)`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-layout-s) var(--spacing-m) 0;
`;

const Title = styled(H1)`
  ${fontRegular}
  margin-bottom: 0;

  @media (min-width: ${breakpoints.m}) {
    margin-top: var(--spacing-l);
  }
`;

const Ingress = styled.p`
  margin: var(--spacing-l) 0;
  font-size: var(--fontsize-body-l);
`;

const Head = (props: HeadProps): JSX.Element => {
  return (
    <Wrapper>
      <Content>
        <Title>{props.heading}</Title>
        <Ingress>{props.text}</Ingress>
      </Content>
    </Wrapper>
  );
};

export default Head;
