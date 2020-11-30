import React from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from 'hds-react';

const Home = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Section>
      <h1>{t('home.title')}</h1>
    </Section>
  );
};

export default Home;
