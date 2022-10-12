import styled, { css } from "styled-components";
import { breakpoints } from "./style";

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

export const Strongish = styled.span`
  ${fontMedium}
`;

export const Strong = styled.span`
  ${fontBold}
`;

export const Regular = styled.span`
  ${fontRegular}
`;

export const H1 = styled.h1`
  font-size: 2.5em;
  ${fontRegular}
  line-height: var(--lineheight-s);
  margin: var(--spacing-s) 0 var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 3em;
    line-height: var(--lineheight-s);
  }
`;

export const H2 = styled.h2`
  font-size: var(--fontsize-heading-m);
  ${fontRegular}
  line-height: var(--lineheight-s);
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 2em;
    line-height: var(--lineheight-m);
  }
`;

export const H3 = styled.h3`
  font-size: var(--fontsize-heading-m);
  ${fontRegular}
  line-height: 2rem;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: 2rem;
  }
`;

export const H4 = styled.h4`
  font-size: var(--fontsize-heading-s);
  ${fontMedium}
  line-height: var(--lineheight-m);
  margin-bottom: var(--spacing-s);

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

export const H5 = styled.h5`
  font-size: var(--fontsize-heading-xs);
  ${fontBold}
  line-height: 1.625;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-s);
    line-height: var(--lineheight-l);
  }
`;

export const H6 = styled.h6`
  font-size: var(--fontsize-heading-xs);
  ${fontBold}
  line-height: 1.4;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-xs);
    line-height: 1.35;
  }
`;
