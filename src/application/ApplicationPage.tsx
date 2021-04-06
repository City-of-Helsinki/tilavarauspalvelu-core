import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { breakpoint } from '../common/style';
import { Application } from '../common/types';
import Container from '../component/Container';
import Head from './Head';
import Stepper from './Stepper';

type ApplicationPageProps = {
  application?: Application;
  translationKeyPrefix: string;
  match?: { url: string };
  breadCrumbText?: string;
  overrideText?: string;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
};

const InnerContainer = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: 18em 1fr;
  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const Main = styled.div`
  margin-top: var(--spacing-s);
`;

const ApplicationPage = ({
  application,
  translationKeyPrefix,
  breadCrumbText,
  headContent,
  overrideText,
  children,
  match,
}: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head
        heading={t(`${translationKeyPrefix}.heading`)}
        breadCrumbText={breadCrumbText || ''}>
        {headContent || overrideText || t(`${translationKeyPrefix}.text`)}
      </Head>
      <Container main>
        <InnerContainer>
          <Stepper application={application} match={match} />
          <Main>{children}</Main>
        </InnerContainer>
      </Container>
    </>
  );
};

export default ApplicationPage;
