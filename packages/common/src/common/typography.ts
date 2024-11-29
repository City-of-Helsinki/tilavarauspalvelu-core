import styled, { css } from "styled-components";
import { breakpoints } from "./style";
import { type SpacingSize } from "../../styles/util";

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

/// @param $large - If true, use larger font size (use case: hero headings)
/// @param $noMargin - If true, remove margin: use on pages with breadcrumbs
/// @param $marginTop - Margin top size: should only be used on pages without breadcrumbs
/// @param $marginBottom - Margin bottom size: should only be used on pages without breadcrumbs
export const H1 = styled.h1<{
  $large?: boolean;
  $noMargin?: boolean;
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
}>`
  font-size: ${({ $large }) =>
    !$large
      ? "var(--fontsize-heading-l)"
      : " var(--fontsize-heading-xl-mobile)"};
  ${fontRegular}
  line-height: var(--lineheight-s);
  margin: ${({ $noMargin, $marginTop, $marginBottom }) =>
    $noMargin
      ? "0"
      : `var(--spacing-${$marginTop ?? "s"}) 0 var(--spacing-${$marginBottom ?? "m"})`};
  word-break: break-word;

  @media (min-width: ${breakpoints.s}) {
    font-size: ${({ $large }) =>
      !$large ? "var(--fontsize-heading-xl)" : "var(--fontsize-heading-xxl)"};
    line-height: var(--lineheight-s);
  }
`;

export const H2 = styled.h2<{
  $noMargin?: boolean;
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
}>`
  font-size: var(--fontsize-heading-m);
  ${fontRegular}
  line-height: var(--lineheight-s);
  margin-bottom: ${({ $noMargin, $marginBottom }) =>
    $noMargin ? `0` : `var(--spacing-${$marginBottom ?? "m"})`};
  margin-top: ${({ $noMargin, $marginTop }) =>
    $noMargin ? `0` : `var(--spacing-${$marginTop ?? "s"})`};

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-l);
    line-height: var(--lineheight-s);
  }
`;

export const H3 = styled.h3<{ $noMargin?: boolean }>`
  font-size: var(--fontsize-heading-s);
  ${fontRegular}
  line-height: 2rem;
  margin-bottom: ${({ $noMargin }) => ($noMargin ? `0` : `var(--spacing-m)`)};
  margin-top: ${({ $noMargin }) => ($noMargin ? `0` : `var(--spacing-s)`)};

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

export const H4 = styled.h4<{
  $noMargin?: boolean;
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
}>`
  font-size: var(--fontsize-heading-s);
  ${fontMedium}
  line-height: var(--lineheight-m);
  margin-bottom: ${({ $noMargin, $marginBottom }) =>
    $noMargin ? `0` : `var(--spacing-${$marginBottom ?? "s"})`};
  margin-top: ${({ $noMargin, $marginTop }) =>
    $noMargin ? `0` : `var(--spacing-${$marginTop ?? "s"})`};

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-m);
  }
`;

export const H5 = styled.h5<{
  $noMargin?: boolean;
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
}>`
  font-size: var(--fontsize-heading-xs);
  ${fontBold}
  line-height: 1.625;
  margin-bottom: ${({ $noMargin, $marginBottom }) =>
    $noMargin ? `0` : `var(--spacing-${$marginBottom ?? "s"})`};
  margin-top: ${({ $noMargin, $marginTop }) =>
    $noMargin ? `0` : `var(--spacing-${$marginTop ?? "s"})`};

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-s);
    line-height: var(--lineheight-l);
  }
`;

export const H6 = styled.h6<{
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
}>`
  font-size: var(--fontsize-heading-xs);
  ${fontBold}
  line-height: 1.4;
  margin-bottom: ${({ $marginBottom }) =>
    `var(--spacing-${$marginBottom ?? "m"})`};
  margin-top: ${({ $marginTop }) => `var(--spacing-${$marginTop ?? "s"})`};

  @media (min-width: ${breakpoints.s}) {
    font-size: var(--fontsize-heading-xs);
    line-height: 1.35;
  }
`;
