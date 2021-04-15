import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconSearch, ImageWithCard } from 'hds-react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import Container from '../component/Container';
import Head from './Head';
import ApplicationPeriods from './ApplicationPeriodList';
import { breakpoint } from '../common/style';

const TopContainer = styled.div`
  margin-right: 30%;
  @media (max-width: ${breakpoint.m}) {
    margin-right: 0%;
  }
`;

const Heading = styled.h2`
  font-size: var(--fontsize-heading-l);
  margin-top: var(--spacing-s);
`;

const StyledImageWithCard = styled(ImageWithCard)`
  && {
    margin-top: var(--spacing-layout-xl);
    max-width: 75rem;

    > :nth-child(2) {
      height: auto;
      margin: 1em;
    }

    @media (max-width: ${breakpoint.s}) {
      margin-top: var(--spacing-layout-s);

      > :nth-child(1) {
        margin: 0;
      }

      > :nth-child(2) {
        height: auto;
        margin: var(--spacing-m) 0 0 0;
        div {
          margin: 0;
        }
      }
    }
  }
`;

const InfoContainer = styled.div`
  margin-top: var(--spacing-s);
  margin-bottom: var(--spacing-m);
`;

const ButtonContainer = styled.div`
  @media (max-width: ${breakpoint.s}) {
    display: flex;
    flex-direction: column;

    > button {
      margin-bottom: var(--spacing-m);
      margin-right: 0;
    }
  }

  margin-top: var(--spacing-xl);

  > button {
    margin-top: var(--spacing-m);
  }
`;

const Home = (): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();

  return (
    <>
      <Head heading={t('home.head.heading')} text={t('home.head.text')} />
      <Container>
        <TopContainer>
          <Heading>{t('home.applicationTimes.heading')}</Heading>
          <p className="text-lg">{t('home.applicationTimes.text')}</p>
        </TopContainer>
        <ApplicationPeriods />
        <StyledImageWithCard
          cardAlignment="right"
          cardLayout="hover"
          color="secondary"
          src="main.jpg">
          <InfoContainer>
            <Heading>{t('home.info.heading')}</Heading>
            <p>{t('home.info.text')}</p>
            <ButtonContainer>
              <Button
                id="browseAllButton"
                variant="secondary"
                theme="black"
                onClick={() => history.push('/search/?search=')}
                iconLeft={<IconSearch />}>
                {t('home.browseAllButton')}
              </Button>
            </ButtonContainer>
          </InfoContainer>
        </StyledImageWithCard>
      </Container>
    </>
  );
};

export default Home;
