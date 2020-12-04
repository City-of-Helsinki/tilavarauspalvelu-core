import React from 'react';
import styles from './MainContainer.module.scss';

interface Props {
  children: React.ReactNode;
}

const MainContainer = ({ ...rest }: Props): JSX.Element => {
  return <main {...rest} className={styles.mainContainer} />;
};

export default MainContainer;
