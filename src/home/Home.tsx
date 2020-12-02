import React from 'react';
import { useTranslation } from 'react-i18next';
import Head from './Head';
import ApplicationPeriods from './ApplicationPeriods';

const Home = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head heading={t('home.head.heading')} text={t('home.head.text')} />
      <ApplicationPeriods />
    </>
  );
};

export default Home;
