import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconSearch, ImageWithCard } from 'hds-react';
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
        <div className={styles.topContainer}>
          <h2 className={styles.heading}>
            {t('home.applicationTimes.heading')}
          </h2>
          <p className="text-lg">{t('home.applicationTimes.text')}</p>
        </div>
        <ApplicationPeriods />
        <ImageWithCard
          className={`${styles.imageWithCard}`}
          cardAlignment="right"
          cardLayout="hover"
          color="secondary"
          src="https://hds.hel.fi/storybook/react/static/media/placeholder_1920x1080.4c706998.jpg">
          <div className={styles.infoContainer}>
            <h2 className={styles.heading}>{t('home.info.heading')}</h2>
            <p>{t('home.info.text')}</p>
            <div className={styles.buttonContainer}>
              <Button
                variant="secondary"
                theme="black"
                onClick={() => history.push('/search')}
                iconLeft={<IconSearch />}>
                {t('home.browseAllButton')}
              </Button>
              <Button disabled variant="secondary" theme="black">
                {t('home.infoButton')}
              </Button>
            </div>
          </div>
        </ImageWithCard>
      </Container>
    </>
  );
};

export default Home;
