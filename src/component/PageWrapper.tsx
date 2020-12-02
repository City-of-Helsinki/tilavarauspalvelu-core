import React from 'react';
import TilavarausNavigation from './TilavarausNavigation';
import Footer from './Footer';

interface Props {
  children: React.ReactNode;
}

export default function NavigationAndFooterWrapper(props: Props): JSX.Element {
  return (
    <>
      <TilavarausNavigation />
      {props.children}
      <Footer />
    </>
  );
}
