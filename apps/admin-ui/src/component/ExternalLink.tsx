import React from "react";
import { IconLinkExternal } from "hds-react";
import styled from "styled-components";

type Props = {
  to: string | null;
  children: string | null;
  size?: "xs" | "s" | "m" | "l" | "xl";
};

const Container = styled.div`
  display: inline-flex;
  align-items: center;

  & svg {
    margin-left: var(--spacing-2-xs);
  }
  &:hover {
    text-decoration: underline;
  }
`;

const Name = styled.span`
  display: flex;
  flex-direction: rows;
`;

export function ExternalLink({
  children,
  to,
  size,
}: Props): JSX.Element | null {
  if (children == null || to == null) {
    return null;
  }
  return (
    <a href={to} target="_blank" rel="noopener noreferrer">
      <Container>
        <Name>{children}</Name>
        <IconLinkExternal size={size} aria-hidden />
      </Container>
    </a>
  );
}
