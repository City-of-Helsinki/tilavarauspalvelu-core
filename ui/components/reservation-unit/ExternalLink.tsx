import React from "react";
import { IconLinkExternal } from "hds-react";
import styled from "styled-components";

type Props = {
  href: string | null;
  name: string | null;
};

const Container = styled.div`
  margin-top: var(--spacing-s);
  display: flex;
  align-items: center;

  & svg {
    margin-left: var(--spacing-xs);
  }
`;

const Name = styled.span`
  display: flex;
  flex-direction: rows;
  font-size: var(--fontsize-body-m);
`;

const ExternalLink = ({ name, href }: Props): JSX.Element | null =>
  name && href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Container>
        <Name>{name}</Name>
        <IconLinkExternal aria-hidden />
      </Container>
    </a>
  ) : null;

export default ExternalLink;
