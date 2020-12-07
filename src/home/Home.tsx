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
        <h2 className="heading-l">Hakeminen</h2>
        <p className="text-lg">
          Vakiovuoroja haetaan yleisen haun kautta. Voit selata tiloja, mutta
          hakemuksen voi ainoastaan jättää silloin kun hakuaika on käynnissä.
        </p>
        <div className={styles.buttonContainer}>
          <Button
            variant="secondary"
            onClick={() => history.push('/search')}
            iconLeft={<IconSearch />}>
            Selaa kaikkia tiloja
          </Button>
          <Button variant="secondary">Lue lisää hakuprosessista</Button>
        </div>
        <h2 className="heading-l" style={{ marginTop: 'var(--spacing-xl)' }}>
          Hakuajat
        </h2>
        <p className="text-lg">
          Vakiovuoroihin on hakuaika kaksi kertaa vuodessa. Ajankohta vaihtelee
          palvelusta ja toimialasta riippuen. Voit tilata sähköpostimuistutuksen
          tuleviin hakuihin.
        </p>
        <ApplicationPeriods />
      </Container>
    </>
  );
};

export default Home;
