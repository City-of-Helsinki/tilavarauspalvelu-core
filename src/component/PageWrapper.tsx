import React from 'react';
import Navigation from './Navigation';
import SideNavigation from './SideNavigation';
import styles from './PageWrapper.module.scss';

interface Props {
  children: React.ReactNode;
}

export default function NavigationAndFooterWrapper(props: Props): JSX.Element {
  return (
    <div className={styles.page}>
      <Navigation />
      <div className={styles.mainLayout}>
        <SideNavigation />
        <main className={`${styles.main} main`}>{props.children}</main>
      </div>
    </div>
  );
}
