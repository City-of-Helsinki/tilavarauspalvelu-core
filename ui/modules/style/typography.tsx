import styled, { css } from "styled-components";
import { breakpoint } from "../style";

export const SubHeading = styled.div`
  margin-top: var(--spacing-xs);
  font-size: var(--fontsize-heading-l);
  font-family: var(--font-bold);

  @media (max-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

export const Strongish = styled.span`
  font-family: var(--font-medium);
  font-size: 500;
`;

export const Strong = styled.span`
  font-family: var(--font-bold);
  font-size: 700;
`;

export const Regular = styled.span`
  font-family: var(--font-regular);
  font-size: 400;
`;

export const H1 = styled.h1`
  font-size: 2.5em;
  font-family: var(--font-regular);
  font-weight: 400;
  line-height: var(--lineheight-s);
  margin: var(--spacing-s) 0 var(--spacing-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: 3em;
    line-height: var(--lineheight-s);
  }
`;

export const H2 = styled.h2`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-regular);
  font-weight: 400;
  line-height: var(--lineheight-s);
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: 2em;
    line-height: var(--lineheight-m);
  }
`;

export const H3 = styled.h3`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-regular);
  font-weight: 400;
  line-height: 2rem;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: 2rem;
  }
`;

export const H4 = styled.h4`
  font-size: var(--fontsize-heading-s);
  font-family: var(--font-medium);
  font-weight: 500;
  line-height: var(--lineheight-m);
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

export const H5 = styled.h5`
  font-size: var(--fontsize-heading-xs);
  font-family: var(--font-bold);
  font-weight: 700;
  line-height: 1.625;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-s);
    line-height: var(--lineheight-l);
  }
`;

export const H6 = styled.h6`
  font-size: var(--fontsize-heading-xs);
  font-family: var(--font-bold);
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-xs);
    line-height: 1.35;
  }
`;

export const HeroSubheading = styled.p`
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-xl);
`;

export const fontRegular = css`
  font-family: var(--font-regular);
  font-weight: 400;
`;

export const fontMedium = css`
  font-family: var(--font-medium);
  font-weight: 500;
`;

export const fontBold = css`
  font-family: var(--font-bold);
  font-weight: 700;
`;

export const KebabHeading = styled.h2`
  &:before,
  &:after {
    background-color: var(--color-black-90);
    content: "";
    display: flex;
    align-self: center;
    height: 1px;
    position: relative;
    width: 50%;
  }

  &:before {
    right: var(--spacing-layout-l);
    margin-left: -50%;
  }

  &:after {
    left: var(--spacing-layout-l);
    margin-right: -50%;
  }

  display: flex;
  overflow: hidden;
  text-align: center;
  justify-content: center;
`;
