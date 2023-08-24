import React from "react";
import styled from "styled-components";
import { breakpoints } from "../common/style";

type Size = "s" | "l";

type Props = {
  children: React.ReactElement | React.ReactElement[];
  size?: Size;
};

const Wrapper = styled.div.attrs(() => ({}))<{ $size: Size }>`
  max-width: ${({ $size }) =>
    $size === "l" ? "var(--container-width-xl)" : "var(--container-width-l)"};
  margin: 0 auto;
  padding-right: var(--spacing-s);
  padding-left: var(--spacing-s);
  --spacing-hz: var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    padding-right: var(--spacing-m);
    padding-left: var(--spacing-m);
    --spacing-hz: var(--spacing-m);
  }
`;

const Container = ({ size = "l", children, ...rest }: Props): JSX.Element => {
  return (
    <Wrapper $size={size} {...rest}>
      {children}
    </Wrapper>
  );
};

export const CenteredContainer = styled(Container)`
  margin: 0 auto;

  @media (min-width: ${breakpoints.m}) {
    max-width: var(--container-width-s);
  }
`;

export default Container;
