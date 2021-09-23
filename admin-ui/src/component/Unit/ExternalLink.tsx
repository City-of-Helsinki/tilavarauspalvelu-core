import React from "react";
import { IconLinkExternal } from "hds-react";
import styled from "styled-components";

type Props = {
  to: string | null;
  children: string | null;
};

const Container = styled.div`
  display: inline-flex;
  align-items: center;

  & svg {
    margin-left: var(--spacing-2-xs);
  }
`;

const Name = styled.span`
  display: flex;
  flex-direction: rows;
`;

const ExternalLink = ({ children, to }: Props): JSX.Element | null =>
  children && to ? (
    <a href={to} target="_blank" rel="noopener noreferrer">
      <Container>
        <Name>{children}</Name>
        <IconLinkExternal aria-hidden />
      </Container>
    </a>
  ) : null;

export default ExternalLink;
