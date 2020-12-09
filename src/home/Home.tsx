import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconSearch } from 'hds-react';
import { useHistory } from 'react-router-dom';
import Container from '../component/Container';
import Head from './Head';
import ApplicationPeriods from './ApplicationPeriodList';
import styles from './Home.module.scss';

const Home = (): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <>
      <Head heading={t('home.head.heading')} text={t('home.head.text')} />
      <Container>
        <h2 className="heading-l">{t('home.info.heading')}</h2>
        <p className="text-lg">{t('home.info.text')}</p>
        <div className={styles.buttonContainer}>
          <Button
            variant="secondary"
            onClick={() => history.push('/search')}
            iconLeft={<IconSearch />}>
            {t('home.browseAllButton')}
          </Button>
          <Button variant="secondary">{t('home.infoButton')}</Button>
        </div>
        <h2 className="heading-l" style={{ marginTop: 'var(--spacing-xl)' }}>
          {t('home.applicationTimes.heading')}
        </h2>
        <p className="text-lg">{t('home.applicationTimes.text')}</p>
        <ApplicationPeriods />
      </Container>
    </>
  );
};

export default Home;
