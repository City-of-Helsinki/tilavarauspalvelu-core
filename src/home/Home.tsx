import React from 'react';
import { useTranslation } from 'react-i18next';
import Head from './Head';

const Home = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head heading={t('home.head.heading')} text={t('home.head.text')} />
      <div style={{ height: '70%' }} />
    </>
  );
};

export default Home;
