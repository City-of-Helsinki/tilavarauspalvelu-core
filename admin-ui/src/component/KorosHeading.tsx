import React, { CSSProperties, ReactNode } from "react";
import styled from "styled-components";
import { Koros } from "hds-react";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";

interface IProps {
  heroImage?: string;
  children?: ReactNode | ReactNode[];
  className?: string;
  style?: CSSProperties;
}

const Wrapper = styled.div.attrs({
  style: {
    "--fill-color": "var(--tilavaraus-admin-header-background-color)",
    "--background-color": "var(--color-white)",
  } as React.CSSProperties,
})<{ $image?: string }>`
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
  display: flex;
  flex-direction: column;
`;

export const Heading = styled(H1).attrs({ $legacy: true })`
  color: var(--color-white);
  margin: 0 var(--spacing-m);
  margin-bottom: var(--spacing-xs);
`;

export const SubHeading = styled.span`
  font-size: var(--fontsize-heading-s);
  font-family: HelsinkiGroteskBold, var(--font-default);
  font-weight: bold;
  letter-spacing: 1px;
  line-height: var(--lineheight-m);
  margin-top: var(--spacing-2-xs);
`;

export const Content = styled.div<{ $heroImage: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-white);
  width: 100%;
  ${({ $heroImage }) =>
    $heroImage
      ? `
      padding: var(--spacing-5-xl) 0;
      justify-content: center;
    `
      : `
      padding: 3.75rem 0 1.25rem;
    `}

  ${H1} {
    ${({ $heroImage }) =>
      $heroImage &&
      `
        font-size: var(--fontsize-heading-l);

        @media (min-width: ${breakpoints.m}) {
          font-size: var(--fontsize-heading-xl);
        }
      `}
  }
`;

const StyledKoros = styled(Koros).attrs(({ flipHorizontal }) => ({
  style: {
    fill: flipHorizontal ? "var(--fill-color)" : "var(--background-color)",
    backgroundColor: flipHorizontal
      ? "var(--background-color)"
      : "var(--fill-color)",
  } as React.CSSProperties,
}))<{ $hasImage: boolean }>`
  ${({ $hasImage }) =>
    $hasImage &&
    `
    background-color: transparent !important;
  `}
  height: 84px;
`;

function KorosHeading({
  heroImage,
  className,
  style,
  children,
}: IProps): JSX.Element {
  return (
    <Wrapper $image={heroImage} className={className} style={style}>
      <Content $heroImage={!!heroImage}>{children}</Content>
      <StyledKoros
        type="pulse"
        flipHorizontal={!heroImage}
        $hasImage={!!heroImage}
      />
    </Wrapper>
  );
}

export default KorosHeading;
