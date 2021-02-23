import React from 'react';
import { IconLinkExternal } from 'hds-react';
import styled from 'styled-components';

type Props = {
  href: string | null;
  name: string | null;
};

const Container = styled.div`
  margin-top: var(--spacing-s);
  display: flex;
  align-items: center;
`;

const Name = styled.span`
  display: flex;
  flex-direction: rows;
  font-size: var(--fontsize-body-m);
`;

const ExtrenalLink = ({ name, href }: Props): JSX.Element | null =>
  name && href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <Container>
        <Name>{name}</Name>
        <IconLinkExternal aria-hidden />
      </Container>
    </a>
  ) : null;

export default ExtrenalLink;
