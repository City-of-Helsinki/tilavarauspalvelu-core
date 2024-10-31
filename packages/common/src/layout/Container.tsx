import React from "react";
import styled, { css } from "styled-components";
import { breakpoints } from "../common/style";

type Size = "s" | "l";

type Props = {
  children: React.ReactNode;
};

const wrapperCss = css`
  max-width: var(--container-width-xl);
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-s);

  --spacing-hz: var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    padding: 0 var(--spacing-m);

    --spacing-hz: var(--spacing-m);
  }

  box-sizing: border-box;
`;

const Wrapper = styled.div<{ $size?: Size }>`
  ${wrapperCss}
`;

/// TODO rename after migrating Container to this
export const StyledContainer = styled.div<{
  $gap?: "2-xs" | "xs" | "s" | "m" | "l" | "xl" | "2-xl";
}>`
  ${wrapperCss}

  display: flex;
  flex-direction: column;
  gap: ${({ $gap }) => ($gap ? `var(--spacing-${$gap})` : "var(--spacing-m)")};
`;

/// @deprecated
const Container = ({ children, ...rest }: Props): JSX.Element => {
  return <Wrapper {...rest}>{children}</Wrapper>;
};

export const CenteredContainer = styled(Container)`
  margin: 0 auto;

  @media (min-width: ${breakpoints.m}) {
    max-width: var(--container-width-s);
  }
`;

export default Container;
