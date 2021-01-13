import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconSearch } from 'hds-react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import Container from '../component/Container';
import Head from './Head';
import ApplicationPeriods from './ApplicationPeriodList';
import { ApplicationPeriod } from '../common/types';

type StaticContext = {
  data: ApplicationPeriod[];
};

interface IProps {
  staticContext?: StaticContext;
}

const ButtonContainer = styled.div`
  @media (max-width: var(--breakpoint-s)) {
    display: flex;
    flex-direction: column;

    & > button {
      margin-bottom: var(--spacing-m);
      margin-right: 0;
    }
  }

  & > button {
    margin-right: var(--spacing-m);
  }
`;

const Home = ({ staticContext }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <>
      <Head heading={t('home.head.heading')} text={t('home.head.text')} />
      <Container>
        <h2 className="heading-l">{t('home.info.heading')}</h2>
        <p className="text-lg">{t('home.info.text')}</p>
        <ButtonContainer>
          <Button
            variant="secondary"
            onClick={() => history.push('/search')}
            iconLeft={<IconSearch />}>
            {t('home.browseAllButton')}
          </Button>
          <Button variant="secondary">{t('home.infoButton')}</Button>
        </ButtonContainer>
        <h2 className="heading-l" style={{ marginTop: 'var(--spacing-xl)' }}>
          {t('home.applicationTimes.heading')}
        </h2>
        <p className="text-lg">{t('home.applicationTimes.text')}</p>
        <ApplicationPeriods data={staticContext?.data} />
      </Container>
    </>
  );
};

export default Home;
