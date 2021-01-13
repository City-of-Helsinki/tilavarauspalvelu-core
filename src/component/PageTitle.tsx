import React from 'react';
import styled from 'styled-components';

interface Props {
  children: React.ReactNode;
}

const Heading = styled.h1`
  font-size: 'var(--fontsize-heading-l)';
`;
const Subheading = styled.h1`
  font-size: 'var(--fontsize-heading-l)';
`;

export const PageTitle = ({ children }: Props): JSX.Element => {
  return <Heading>{children}</Heading>;
};

export const PageSubTitle = ({ children }: Props): JSX.Element => {
  return <Subheading>{children}</Subheading>;
};
