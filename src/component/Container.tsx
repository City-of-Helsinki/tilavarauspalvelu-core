import React from 'react';
import styles from './Container.module.scss';

interface Props {
  children: React.ReactNode;
  // eslint-disable-next-line react/require-default-props
  main?: boolean;
  // eslint-disable-next-line react/require-default-props
  style?: React.CSSProperties;
}

const Container = ({ main = false, ...rest }: Props): JSX.Element => {
  return main ? (
    <main {...rest} className={styles.mainContainer} />
  ) : (
    <div {...rest} className={styles.mainContainer} />
  );
};

export default Container;
