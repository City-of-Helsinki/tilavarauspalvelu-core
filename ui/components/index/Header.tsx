import React from "react";
import styled from "styled-components";
import { fontRegular, H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";

interface HeadProps {
  heading: string;
  text: string;
}

const Wrapper = styled.div`
  width: 100%;
  color: var(--color-black);
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-layout-m);
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled(H1)`
  ${fontRegular}
  margin-bottom: 0;
  margin-top: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    margin-top: var(--spacing-l);
  }
`;

const Ingress = styled.p`
  margin: var(--spacing-m) 0 0;
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
