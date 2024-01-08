import { css } from "styled-components";

export type ButtonStyleProps = {
  readonly variant?: "primary" | "secondary";
  readonly size?: "normal" | "large";
  readonly fontSize?: "small" | "normal";
  readonly disabled?: boolean;
};

export const ButtonCss = css<ButtonStyleProps>`
  --background-color-hover: ${({ variant }) =>
    variant === "primary" ? "var(--color-bus-dark)" : "var(--color-black-5)"};
  --color-hover: ${({ variant }) =>
    variant === "primary" ? "var(--color-white)" : "var(--color-black)"};
  --background-color-focus: ${({ variant }) =>
    variant === "primary" ? "var(--color-bus)" : "transparent"};
  --color-focus: ${({ variant }) =>
    variant === "primary" ? "var(--color-white)" : "var(--color-black)"};
  --focus-outline-color: var(--color-focus-outline);
  --outline-gutter: 2px;
  --outline-width: 3px;
  --font-size: ${({ fontSize }) =>
    fontSize === "small" ? "var(--fontsize-body-s)" : "var(--fontsize-body-m)"};

  font-size: var(--font-size);

  opacity: ${({ disabled }) => (disabled ? "0.5" : "1")};
  text-decoration: none;
  background-color: ${({ variant }) =>
    variant === "primary" ? "var(--color-bus)" : "transparent"};
  color: ${({ variant }) =>
    variant === "primary" ? "var(--color-white)" : "var(--color-black)"};
  padding: ${({ size }) => (size === "large" ? "4px 20px" : "0 20px")};
  border: 2px solid
    ${({ variant }) =>
      variant === "primary" ? "var(--color-bus)" : "var(--color-black)"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  line-height: 1;
  text-align: center;
  height: 44px;
  &:hover,
  &:focus-visible {
    transition-property: background-color, border-color, color;
    transition-duration: 85ms;
    transition-timing-function: ease-out;
  }
  &:hover {
    background-color: var(--background-color-hover);
    color: var(--color-hover);
  }
  &:focus-visible {
    background-color: var(--background-color-focus, transparent);
    color: var(--color-focus);
    outline-offset: var(--outline-gutter);
    outline: var(--outline-width) solid var(--focus-outline-color);
  }
`;
