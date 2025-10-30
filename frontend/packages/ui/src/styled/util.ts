import { Button, ButtonVariant, LoadingSpinner } from "hds-react";
import styled from "styled-components";
import { breakpoints } from "@ui/modules/const";

export const NoWrap = styled.span`
  white-space: nowrap;
`;

export const HR = styled.hr<{
  $type?: "dashed" | "solid";
}>`
  border: 0;
  border-top: 1px ${({ $type }) => $type ?? "solid"} var(--color-black-10);
  width: 100%;
`;

interface AutoGridProps {
  $minWidth?: string;
  $alignCenter?: boolean;
  $gap?: SpacingSize;
}

export const AutoGrid = styled.div<AutoGridProps>`
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(${({ $minWidth }) => ($minWidth && $minWidth?.length > 0 ? $minWidth : "16rem")}, 1fr)
  );
  align-items: ${({ $alignCenter }) => ($alignCenter ? "center" : "baseline")};
  gap: ${({ $gap }) => ($gap ? `var(--spacing-${$gap})` : "var(--spacing-m)")} var(--spacing-m);

  & > :not(img):not(hr):empty {
    display: none;
  }
`;

export const FullRow = styled.div`
  grid-column: 1 / -1;
`;

export const P = styled.p<{
  $noMargin?: boolean;
}>`
  ${({ $noMargin }) => ($noMargin ? "margin: 0" : "")}
`;

export type SpacingSize = "none" | "2-xs" | "xs" | "s" | "m" | "l" | "xl" | "2-xl";

// TODO should allow for switching to smaller gap on mobile (scale down)
export const Flex = styled.div<{
  $direction?: "row" | "column" | "row-reverse" | "column-reverse";
  $gap?: SpacingSize;
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
  $justifyContent?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  $alignItems?: "center" | "flex-start" | "flex-end" | "baseline" | "stretch";
  $wrap?: "wrap" | "nowrap";
  $width?: "full" | "auto";
}>`
  display: flex;
  flex-wrap: ${({ $wrap }) => $wrap ?? "nowrap"};
  gap: ${({ $gap }) => ($gap != null ? `var(--spacing-${$gap})` : "var(--spacing-m)")};
  flex-direction: ${({ $direction }) => $direction ?? "column"};
  justify-content: ${({ $justifyContent }) => $justifyContent ?? "initial"};
  align-items: ${({ $alignItems }) => $alignItems ?? "initial"};
  margin-top: ${({ $marginTop }) => ($marginTop ? `var(--spacing-${$marginTop})` : "0")};
  margin-bottom: ${({ $marginBottom }) => ($marginBottom ? `var(--spacing-${$marginBottom})` : "0")};
  width: ${({ $width }) => ($width === "full" ? "100%" : "auto")};
`;

// TODO refactor this to have parameters for gap
// use grid instead of flex
// two buttons should be side-by-side on mobile (100% width total)
// three buttons need a 1, 1/2, 1/2 layout on mobile (100% width total, two rows)
// four buttons need 1/2, 1/2, 1/2, 1/2 layout on mobile (100% width total, two rows)
export const ButtonContainer = styled.div<{
  $justifyContent?: "center" | "flex-start" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  $marginTop?: SpacingSize;
  $marginBottom?: SpacingSize;
}>`
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--spacing-2-xs);
  width: 100%;
  margin-bottom: ${({ $marginBottom }) => `var(--spacing-${$marginBottom ?? "none"})`};
  margin-top: ${({ $marginTop }) => `var(--spacing-${$marginTop ?? "none"})`};
  justify-content: ${({ $justifyContent }) => $justifyContent ?? "flex-end"};

  @media (max-width: ${breakpoints.s}) {
    flex-direction: column;
    gap: var(--spacing-s);
  }
`;

export const CenterSpinner = styled(LoadingSpinner)`
  margin: 0 auto var(--spacing-2-xl) auto;
`;

/// Tab causes horizontal overflow without this
/// we use grids primarily and components inside grid without max-width overflow.
export const TabWrapper = styled.div`
  max-width: calc(100vw - 2 * var(--spacing-xs));
  @media (min-width: ${breakpoints.s}) {
    max-width: calc(100vw - 2 * var(--spacing-s));
  }
  @media (min-width: ${breakpoints.m}) {
    max-width: calc(100vw - 2 * var(--spacing-m));
  }
`;

/// Container for Heading + label / buttons
/// Assumes that you disable outer margins on the children and it's inside a flex container with gaps.
/// With breadcrumbs, use $noMargin.
export const TitleSection = styled(Flex).attrs({
  $direction: "row",
  $justifyContent: "space-between",
  $wrap: "wrap",
  $alignItems: "flex-start",
  $gap: "xs",
})<{ $noMargin?: boolean }>`
  margin-top: ${({ $noMargin }) => ($noMargin ? "0" : "var(--spacing-l)")};
`;

// inverted button colors to be used on dark background
export const WhiteButton = styled(Button)<{
  disabled?: boolean;
  variant: ButtonVariant;
  $colorVariant?: "light" | "dark";
}>`
  && {
    --color-hover: var(--color-black);
    --color-focus: var(--color-black);

    ${({ variant, $colorVariant }) => {
      switch (variant) {
        case "primary":
          return `
      --color: var(--color-black);
      --background-color: var(--color-white);
      --background-color-hover: var(--color-black-80);
      --background-color-focus: var(--color-black-80);
      --color-disabled: var(--color-black-80);
      --color-hover: var(--color-white);
      --color-focus: var(--color-white);
  `;
        case "secondary":
          return `
      --color: var(--color-white);
      --border-color: var(--color-white);
      --background-color: var(--color-bus${$colorVariant === "light" ? "" : "-dark"});
  `;
        case "supplementary":
          return `
      --color: var(--color-white);
      --background-color: var(--color-bus${$colorVariant === "light" ? "" : "-dark"});
      --border-color: transparent;
  `;
        default:
          return "";
      }
    }}
  }
`;
