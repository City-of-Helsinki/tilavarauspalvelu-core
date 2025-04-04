import { css } from "styled-components";

export const truncatedText = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// css doesn't allow overriding local variables so can't define a default value for a visited link here
export const visitedStyles = css`
  &:visited {
    color: var(--link-visited-color);
  }
`;

// Define a default value for a disabled link
export const anchorStyles = css`
  color: var(--color-black-30);
  cursor: default;
  &:link {
    color: var(--color-black);
    cursor: pointer;
  }
`;

// default z-order > 0 to draw the box shadow over other elements
export const focusStyles = css`
  --background-color-focus: transparent;
  --color-focus: var(--color-black);
  --focus-outline-color: var(--color-focus-outline);
  --outline-width: 3px;
  --z-index-focus: 1;

  z-index: var(--z-index-focus);

  &:focus-within,
  &:focus-visible {
    transition-property: background-color, border-color, color;
    transition-duration: 85ms;
    transition-timing-function: ease-out;
    background-color: var(--background-color-focus, transparent);
    color: var(--color-focus);
    outline: none;
    box-shadow: 0 0 2px var(--outline-width) var(--focus-outline-color);
  }
`;
