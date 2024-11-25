import React from "react";
import { IconLinkExternal } from "hds-react";
import styled from "styled-components";
import { Link } from "react-router-dom";

type Props = {
  to: string;
  children: string;
  size?: "xs" | "s" | "m" | "l" | "xl";
};

const StyledLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export function ExternalLink({
  children,
  to,
  size,
}: Props): JSX.Element | null {
  return (
    <StyledLink to={to} target="_blank" rel="noopener noreferrer">
      <span>{children}</span>
      <IconLinkExternal size={size} aria-hidden />
    </StyledLink>
  );
}
