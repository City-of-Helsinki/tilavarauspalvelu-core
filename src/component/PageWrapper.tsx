import React from 'react';
import styled from 'styled-components';
import Navigation from './Navigation';
import Footer from './Footer';
import ServiceNotification from './ServiceNotification';

interface Props {
  children: React.ReactNode;
}
const Main = styled.main`
  font-size: var(--fontsize-body-m);
  flex-grow: 1;
`;

const PageWrapper = (props: Props): JSX.Element => {
  return (
    <>
      <Navigation />
      <ServiceNotification />
      <Main id="main">{props.children}</Main>
      <div
        style={{
          marginTop: 'var(--spacing-layout-xl)',
        }}
      />
      <Footer />
    </>
  );
};

export default PageWrapper;
