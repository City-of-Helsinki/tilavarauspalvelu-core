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

export const SemiBold = styled.span`
  ${fontMedium}
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

export const H1 = styled.h1<{ $large?: boolean; $noMargin?: boolean }>`
  font-size: ${({ $large }) =>
    !$large
      ? "var(--fontsize-heading-l)"
      : " var(--fontsize-heading-xl-mobile)"};
  ${fontRegular}
  line-height: var(--lineheight-s);
  margin: ${({ $noMargin }) =>
    $noMargin ? "0" : "var(--spacing-s) 0 var(--spacing-m)"};
  word-break: break-word;

  @media (min-width: ${breakpoints.s}) {
    font-size: ${({ $large }) =>
      !$large ? "var(--fontsize-heading-xl)" : "var(--fontsize-heading-xxl)"};
    line-height: var(--lineheight-s);
  }
`;

export const H2 = styled.h2<{ $large?: boolean; $noMargin?: boolean }>`
  font-size: ${({ $large }) =>
    !$large ? `var(--fontsize-heading-m)` : `var(--fontsize-heading-l)`};
  ${fontRegular}
  line-height: var(--lineheight-s);
  margin-bottom: ${({ $noMargin }) => ($noMargin ? `0` : `var(--spacing-m)`)};
  margin-top: ${({ $noMargin }) => ($noMargin ? `0` : `var(--spacing-s)`)};

  @media (min-width: ${breakpoints.s}) {
    ${({ $large }) =>
      !$large
        ? `
          font-size: var(--fontsize-heading-l);
          line-height: var(--lineheight-m);
        `
        : `
          font-size: var(--fontsize-heading-xl);
          line-height: var(--lineheight-s);
        `})}
  }
`;

export const H3 = styled.h3<{ $large?: boolean }>`
  font-size: ${({ $large }) =>
    !$large ? `var(--fontsize-heading-s)` : `var(--fontsize-heading-m)`};
  ${fontRegular}
  line-height: 2rem;
  margin-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.s}) {
    font-size: ${({ $large }) =>
      !$large ? `var(--fontsize-heading-xs)` : `var(--fontsize-heading-s)`};
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
