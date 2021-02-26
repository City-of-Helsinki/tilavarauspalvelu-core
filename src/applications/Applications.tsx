import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
  height: 100%;
`;

const Applications = (): JSX.Element | null => {
  return (
    <Container>
      <span>todo: Logged in page, list of applications etc...</span>
    </Container>
  );
};

export default Applications;
