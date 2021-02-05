import React from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

interface Props {
  children: React.ReactNode;
}

export default function NavigationAndFooterWrapper(props: Props): JSX.Element {
  return (
    <>
      <Navigation />
      <main>{props.children}</main>
      <div
        style={{
          marginTop: 'var(--spacing-layout-xl)',
        }}
      />
      <Footer />
    </>
  );
}
