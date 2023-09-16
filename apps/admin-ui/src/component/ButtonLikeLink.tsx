import styled from "styled-components";
import { Link } from "react-router-dom";

type ButtonProps = {
  readonly variant?: "primary" | "secondary";
  readonly size?: "normal" | "large";
};

/// @brief looks like a button but is a link
/// @desc why? because nesting buttons and links is invalid html and HDS doesn't include this
/// Looks like a HDS button (should have all the same styles)
/// This requires react-router-dom (no next/link support yet)
/// Differences to HDS: secondary is black themed since we don't use the standard light blue
/// @param variant: 'primary' | 'secondary'
/// @param size: 'normal' | 'large'
export const ButtonLikeLink = styled(Link)<ButtonProps>`
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
