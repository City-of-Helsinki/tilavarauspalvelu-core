import React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import styled from 'styled-components';
import groupBy from 'lodash/groupBy';
import { getApplications, getApplicationRounds } from '../common/api';
import {
  Application,
  ApplicationRound,
  ReducedApplicationStatus,
} from '../common/types';
import Head from './Head';
import ApplicationsGroup from './ApplicationsGroup';
import { getReducedApplicationStatus } from '../common/util';
import { useApiData } from '../common/hook/useApiData';
import Loader from '../component/Loader';

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
  height: 100%;
`;

const statusGroupOrder: ReducedApplicationStatus[] = [
  'sent',
  'processing',
  'draft',
  'declined',
  'cancelled',
];

function ApplicationGroups({
  rounds,
  applications,
  t,
}: {
  rounds: { [key: number]: ApplicationRound };
  applications: { [key: string]: Application[] };
  t: TFunction;
}): JSX.Element {
  if (Object.keys(applications).length === 0) {
    return <span>{t('Applications.noApplications')}</span>;
  }
  return (
    <>
      {statusGroupOrder.map((gr) => (
        <ApplicationsGroup
          key={gr}
          name={t(`Applications.group.${gr}`)}
          rounds={rounds}
          applications={applications[gr] || []}
        />
      ))}
    </>
  );
}

const Applications = (): JSX.Element | null => {
  const { t } = useTranslation();

  const applications = useApiData(getApplications, {}, (apps) =>
    groupBy(
      apps.filter((app) => app.status !== 'cancelled'),
      (a) => getReducedApplicationStatus(a.status)
    )
  );

  const rounds = useApiData(getApplicationRounds, {}, (applicationRounds) =>
    applicationRounds.reduce((prev, current) => {
      return { ...prev, [current.id]: current };
    }, {} as { [key: number]: ApplicationRound })
  );

  return (
    <>
      <Head heading={t('Applications.heading')} />
      <Container>
        <Loader datas={[applications, rounds]}>
          <ApplicationGroups
            t={t}
            rounds={rounds.transformed || {}}
            applications={applications.transformed || {}}
          />
        </Loader>
      </Container>
    </>
  );
};

export default Applications;
