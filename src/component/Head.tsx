import React from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from 'hds-react';

require('./Head.scss');

const Head = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <div id="head">
      <Section color="secondary" korosType="wave">
        <h1>{t('heading')}</h1>
        {t('subheading')}
      </Section>
    </div>
  );
};

export default Head;
