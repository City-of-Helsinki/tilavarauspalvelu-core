import React from 'react';
import styles from './SideNavigation.module.scss';

export default (): JSX.Element => (
  <ul className={styles.sideNavigation}>
    <li>Hakemukset</li>
    <li>Asiakkaat</li>
    <li>...</li>
  </ul>
);
