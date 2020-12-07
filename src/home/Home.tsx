import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconSearch } from 'hds-react';
import { useHistory } from 'react-router-dom';
import Card from '../component/Card';
import MainContainer from '../component/MainContainer';
import Head from './Head';
import ApplicationPeriods from './ApplicationPeriodList';
import styles from './Home.module.scss';

const Home = (): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <>
      <Head heading={t('home.head.heading')} text={t('home.head.text')} />
      <MainContainer>
        <Card
          heading="Hakeminen"
          text="Vakiovuoroja haetaan yleisen haun kautta. Voit selata tiloja, mutta
          hakemuksen voi ainoastaan jättää silloin kun hakuaika on käynnissä.">
          <div className={styles.buttonContainer}>
            <Button
              variant="secondary"
              onClick={() => history.push('/search')}
              iconLeft={<IconSearch />}>
              Selaa kaikkia tiloja
            </Button>
            <Button variant="secondary">Lue lisää hakuprosessista</Button>
          </div>
        </Card>
        <Card
          heading="Hakuajat"
          text="Vakiovuoroihin on hakuaika kaksi kertaa vuodessa. Ajankohta vaihtelee
          palvelusta ja toimialasta riippuen. Voit tilata sähköpostimuistutuksen
          tuleviin hakuihin.">
          <ApplicationPeriods />
        </Card>
      </MainContainer>
    </>
  );
};

export default Home;
