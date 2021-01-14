import React from 'react';
import { Koros, KorosType } from 'hds-react';
import { useTranslation } from 'react-i18next';
import styles from './Head.module.css';
import Breadcrumb from '../component/Breadcrumb';

type HeadProps = {
  heading: string;
  text: string;
  breadCrumbText: string;
  korosType: KorosType;
};

const Head = ({
  text,
  heading,
  korosType,
  breadCrumbText,
}: HeadProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Breadcrumb
          current={{
            label: `${t('breadcrumb.application')} - ${breadCrumbText}`,
            linkTo: '#',
          }}
        />
        <h1 className={styles.heading}>{heading}</h1>
        <span className={styles.text}>{text}</span>
      </div>
      <Koros
        flipHorizontal
        className={`${styles.koros} koros`}
        type={korosType}
      />
    </div>
  );
};

export default Head;
