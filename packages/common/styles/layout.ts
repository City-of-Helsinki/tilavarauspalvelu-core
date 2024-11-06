import { css } from "styled-components";
import { breakpoints } from "../src";

export const mainStyles = css`
  box-sizing: border-box;
  max-width: var(--tilavaraus-page-max-width);
  margin: 0 auto;
  width: 100%;

  display: flex;
  flex-direction: column;
  flex-grow: 1;

  gap: var(--spacing-m);
  @media (width > ${breakpoints.m}) {
    gap: var(--spacing-l);
  }

  /* NOTE these are copied from HDS --header-margin
   * but it's a local variable so we can't use it here */
  padding: 0 var(--spacing-xs);
  @media (min-width: ${breakpoints.s}) {
    padding: 0 var(--spacing-s);
  }
  @media (min-width: ${breakpoints.m}) {
    padding: 0 var(--spacing-m);
  }
`;
