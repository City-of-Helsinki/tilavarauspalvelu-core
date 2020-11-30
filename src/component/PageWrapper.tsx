import React from 'react';
import Navigation from './Navigation';
import Head from './Head';
import Footer from './Footer';
import styles from './PageWrapper.module.scss';

interface Props {
  children: React.ReactNode;
}

export default function NavigationAndFooterWrapper(props: Props): JSX.Element {
  return (
    <>
      <Navigation />
      <Head />
      <div className={styles.mainLayout}>
        <main className={`${styles.main} main`}>{props.children}</main>
      </div>
      <Footer />
    </>
  );
}
