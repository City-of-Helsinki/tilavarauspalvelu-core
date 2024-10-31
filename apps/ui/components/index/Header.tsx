import React from "react";
import styled from "styled-components";
import { fontRegular, H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";

interface HeadProps {
  heading: string;
  text: string;
}

const Title = styled(H1).attrs({ $large: true })`
  ${fontRegular}
  margin: 0;

  /* TODO why isn't top margin instead a bottom margin / gap on the layout? it's on every page */
  margin-top: var(--spacing-m);
  @media (min-width: ${breakpoints.m}) {
    margin-top: var(--spacing-l);
  }
`;

const Ingress = styled.p`
  margin: 0;
  font-size: var(--fontsize-body-l);
`;

export function Head(props: HeadProps): JSX.Element {
  return (
    <>
      <Title>{props.heading}</Title>
      <Ingress>{props.text}</Ingress>
    </>
  );
}
