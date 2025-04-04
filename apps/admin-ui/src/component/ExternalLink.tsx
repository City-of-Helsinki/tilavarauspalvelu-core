import React from "react";
import { IconLinkExternal, IconSize } from "hds-react";
import styled from "styled-components";
import { fontMedium } from "common/styled";
import { Link } from "react-router-dom";

type Props = {
  to: string;
  children: string;
  size?: IconSize;
  isBold?: boolean;
};

const StyledLink = styled(Link)<{ $isBold?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2-xs);

  ${({ $isBold }) => ($isBold ? `${fontMedium}` : "")}

  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

export function ExternalLink({
  children,
  to,
  size,
  isBold = false,
}: Props): JSX.Element | null {
  return (
    <StyledLink
      to={to}
      target="_blank"
      rel="noopener noreferrer"
      $isBold={isBold}
    >
      <span>{children}</span>
      <IconLinkExternal size={size} aria-hidden />
    </StyledLink>
  );
}
