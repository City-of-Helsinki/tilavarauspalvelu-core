import { css } from "styled-components";
import { breakpoints } from "../src/const";

// the dynamic side margins for the page layout
// NOTE these are copied from HDS --header-margin but it's a local variable so we can't use it here
export const pageSideMargins = css`
  box-sizing: border-box;
  padding-left: var(--spacing-xs);
  padding-right: var(--spacing-xs);
  @media (min-width: ${breakpoints.s}) {
    padding-left: var(--spacing-s);
    padding-right: var(--spacing-s);
  }
  @media (min-width: ${breakpoints.m}) {
    padding-left: var(--spacing-m);
    padding-right: var(--spacing-m);
  }
`;

export const mainStyles = css`
  box-sizing: border-box;
  max-width: var(--tilavaraus-page-max-width);
  margin: 0 auto;
  width: 100%;

  /* don't add gaps for empty elements */
  & > :not(img):not(hr):empty {
    display: none;
  }

  display: flex;
  flex-direction: column;
  flex-grow: 1;

  gap: var(--spacing-m);
  @media (min-width: ${breakpoints.m}) {
    gap: var(--spacing-l);
  }

  /* add bit bottom padding so content doesn't touch the bottom (or the footer Koros) */
  padding-bottom: var(--spacing-xl);

  ${pageSideMargins}
`;
