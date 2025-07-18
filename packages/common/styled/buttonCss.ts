import styled, { css } from "styled-components";
import { focusStyles } from "./cssFragments";
import { breakpoints } from "../src/const";

export type ButtonStyleProps = {
  readonly variant?: "primary" | "secondary";
  readonly size?: "normal" | "large";
  readonly fontSize?: "small" | "normal";
  readonly disabled?: boolean;
  readonly width?: "full" | "auto";
};

export const ButtonCss = css<ButtonStyleProps>`
  --background-color-hover: ${({ variant }) =>
    variant === "primary" ? "var(--color-bus-dark)" : "var(--color-black-20)"};
  --color-hover: ${({ variant }) => (variant === "primary" ? "var(--color-white)" : "var(--color-black)")};
  --background-color-focus: var(--background-color-hover);
  --color-focus: var(--color-hover);
  --focus-outline-color: var(--color-focus-outline);
  --outline-gutter: 2px;
  --outline-width: 3px;
  --font-size: ${({ fontSize }) => (fontSize === "small" ? "var(--fontsize-body-s)" : "var(--fontsize-body-m)")};
  --color: ${({ variant }) => (variant === "primary" ? "var(--color-white)" : "var(--color-black)")};

  font-size: var(--font-size);

  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  text-decoration: none;
  color: var(--color);
  background-color: ${({ variant }) => (variant === "primary" ? "var(--color-bus)" : "var(--color-white)")};
  padding: ${({ size }) => (size === "large" ? "12px 20px" : "0 20px")};
  border: 2px solid ${({ variant }) => (variant === "primary" ? "var(--color-bus)" : "var(--color-black)")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 80px;
  width: ${({ width }) => (width === "full" ? "100%" : "auto")};
  line-height: 1;
  text-align: center;
  min-height: 44px;
  &:visited {
    color: var(--color);
  }
  &:hover,
  &:focus-visible {
    transition-property: background-color, border-color, color;
    transition-duration: 85ms;
    transition-timing-function: ease-out;
  }
  &:hover {
    background-color: var(--background-color-hover);
    color: var(--color-hover);
    cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  }
  &:focus-visible {
    background-color: var(--background-color-focus, transparent);
    color: var(--color-focus);
    outline-offset: var(--outline-gutter);
    outline: var(--outline-width) solid var(--focus-outline-color);
  }
  @media (max-width: ${breakpoints.s}) {
    width: 100%;
  }
`;

export const LinkLikeButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--content-font-size);
  line-height: var(--content-line-height);
  padding: 0;
  text-decoration: underline;
  &:hover {
    text-decoration: none;
  }
  ${focusStyles}
  &:disabled {
    cursor: not-allowed;
    color: var(--color-black-40);
  }

  /* properly align text + icon */
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-3-xs);
`;

export const toggleButtonCss = css`
  --focus-ring-color: var(--color-coat-of-arms);
  color: var(--color-black);
  padding: 0;
  border-radius: 0;
  border-width: 2px;
  border-color: transparent;
  background-color: transparent;

  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);

  :not(:disabled) {
    :hover {
      background-color: var(--color-black-10);
      cursor: pointer;
    }
    :focus {
      outline: none;
      border-color: var(--focus-ring-color);
    }
  }
  :disabled {
    color: var(--color-black-50);
    cursor: not-allowed;
  }
`;
