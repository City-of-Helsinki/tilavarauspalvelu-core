import React from 'react';
import { Koros } from 'hds-react';
import styles from './Head.module.css';

interface HeadProps {
  heading: string;
  text: string;
}

const Head = (props: HeadProps): JSX.Element => (
  <div className={styles.container}>
    <div className={styles.content}>
      <h1>{props.heading}</h1>
      <span>{props.text}</span>
    </div>
    <Koros className={styles.koros} type="wave" />
  </div>
);

export default Head;
