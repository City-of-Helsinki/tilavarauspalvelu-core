import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAsync } from 'react-use';
import styled from 'styled-components';
import groupBy from 'lodash/groupBy';
import { getApplications, getApplicationRounds } from '../common/api';
import { Application, ApplicationRound } from '../common/types';
import Head from './Head';
import { CenterSpinner } from '../component/common';
import ApplicationsGroup from './ApplicationsGroup';

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
  height: 100%;
`;

const statusGroupOrder = ['draft', 'sent', 'ready', 'declined', 'cancelled'];

const getGroup = (application: Application): string => {
  switch (application.status) {
    case 'in_review':
    case 'review_done':
    case 'allocating':
    case 'allocated':
    case 'validated':
      return 'sent';
    default:
      return application.status;
  }
};

const Applications = (): JSX.Element | null => {
  const { t } = useTranslation();

  const [applications, setApplications] = useState(
    {} as { [key: string]: Application[] }
  );
  const [rounds, setRounds] = useState(
    {} as { [key: number]: ApplicationRound }
  );

  const status = useAsync(async () => {
    const loadedApplications = await getApplications();
    const groupedApplications = groupBy(loadedApplications, getGroup);
    setApplications(groupedApplications);
    const loadedRounds = await getApplicationRounds();
    setRounds(
      loadedRounds.reduce((prev, current) => {
        return { ...prev, [current.id]: current };
      }, {} as { [key: number]: ApplicationRound })
    );
  }, []);

  return (
    <>
      <Head heading={t('Applications.heading')} />
      <Container>
        {status.loading ? (
          <CenterSpinner />
        ) : (
          statusGroupOrder.map((gr) => (
            <ApplicationsGroup
              key={gr}
              name={t(`Applications.group.${gr}`)}
              rounds={rounds}
              applications={applications[gr] || []}
            />
          ))
        )}
      </Container>
    </>
  );
};

export default Applications;
