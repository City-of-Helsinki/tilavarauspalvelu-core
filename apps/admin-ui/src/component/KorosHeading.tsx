import React, { type CSSProperties, type ReactNode } from "react";
import styled, { css } from "styled-components";
import { Koros } from "hds-react";
import { Flex, H1 } from "common/styled";

interface IProps {
  heroImage: string;
  children?: ReactNode | ReactNode[];
  className?: string;
  style?: CSSProperties;
}

const overdrawCss = css`
  width: 100vw;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
`;

const Wrapper = styled.div<{ $image?: string }>`
  --fill-color: var(--color-bus-dark);
  --background-color: var(--color-white);

  ${overdrawCss};
  display: flex;
  flex-direction: column;

  ${({ $image }) =>
    $image
      ? `
    background-image: linear-gradient(-180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.65) 100%), url(${$image});
    background-size: cover;
    background-position: center;
  `
      : `
  background-color: var(--fill-color);
  `}
`;

export const Heading = styled(H1)`
  color: var(--color-white);
`;

const Content = styled(Flex).attrs({
  $alignItems: "center",
  $justifyContent: "center",
})`
  color: var(--color-white);
  width: 100%;
  padding: var(--spacing-5-xl) 0;
`;

const StyledKoros = styled(Koros)`
  --background-color: transparent;
  fill: var(--color-white);
  height: 84px;
`;

export function KorosHeading({ heroImage, className, style, children }: IProps): JSX.Element {
  return (
    <Wrapper $image={heroImage} className={className} style={style}>
      <Content>{children}</Content>
      <StyledKoros type="pulse" />
    </Wrapper>
  );
}
