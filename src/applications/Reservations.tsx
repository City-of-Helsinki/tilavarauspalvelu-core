import {
  Button,
  IconCalendar,
  IconDownload,
  IconMenuHamburger,
  Notification,
} from 'hds-react';
import { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  getApplication,
  getApplicationRound,
  getRecurringReservations,
} from '../common/api';
import { ApiData, useApiData } from '../common/hook/useApiData';
import { breakpoint } from '../common/style';
import { Application, RecurringReservation } from '../common/types';
import { SubHeading } from '../common/Typography';
import { parseDate } from '../common/util';
import Back from '../component/Back';
import { TwoColumnContainer } from '../component/common';
import Loader from '../component/Loader';
import ReservationsView from './ReservationsView';

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  height: 100%;
  @media (max-width: ${breakpoint.m}) {
    padding: var(--spacing-s);
  }
`;

const RoundName = styled.div`
  font-size: var(--fontsize-heading-xl);
  font-family: var(--font-bold);
  @media (max-width: ${breakpoint.s}) {
    font-size: var(--fontsize-heading-l);
  }
`;

const ResolutionDescription = styled.div`
  margin-top: var(--spacing-s);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

const Applicant = styled.div`
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-s);
`;

const Modified = styled.div`
  font-size: var(--fontsize-body-m);
  font-family: var(--font-regular);
`;

const Buttons = styled.div`
  justify-self: end;
  @media (max-width: ${breakpoint.s}) {
    width: 100%;
  }
`;
const ToggleButton = styled(Button)`
  margin-top: var(--spacing-m);
  @media (max-width: ${breakpoint.s}) {
    width: 100%;
  }
`;

type ParamTypes = {
  applicationId: string;
};

const getApplicant = (application: Application, t: TFunction): string => {
  if (application?.organisation) {
    return t('ApplicationCard.organisation', {
      type: t(`ApplicationCard.applicantType.${application.applicantType}`),
      name: application.organisation?.name || t('ApplicationCard.noName'),
    });
  }
  if (application?.contactPerson) {
    return t('ApplicationCard.person');
  }

  return '';
};

const modified = (
  application: ApiData<Application, unknown>,
  t: TFunction
): JSX.Element => {
  return (
    <Modified>
      {application.data?.lastModifiedDate
        ? t('ApplicationCard.saved', {
            date: parseDate(application.data?.lastModifiedDate),
          })
        : ''}
    </Modified>
  );
};

const Reservations = (): JSX.Element | null => {
  const { applicationId } = useParams<ParamTypes>();
  const [isCalendar, setIsCalendar] = useState(false);
  const [status, setStatus] = useState<'init' | 'loading' | 'done' | 'error'>(
    'init'
  );

  const { t } = useTranslation();

  const application = useApiData(getApplication, Number(applicationId));

  const applicationRound = useApiData(
    getApplicationRound,
    application.data ? { id: application.data.applicationRoundId } : undefined
  );

  const reservations = useApiData(
    getRecurringReservations,
    Number(applicationId)
  );

  const hasReservations = reservations.data?.length;

  const reservationsResultText = t(
    hasReservations
      ? 'Reservations.resultWithReservations'
      : 'Reservations.resultWithoutReservations'
  );
  return (
    <Container>
      <Back label="Reservations.back" />
      <Loader datas={[application, applicationRound, reservations]}>
        <RoundName>{applicationRound.data?.name}</RoundName>
        <Applicant>
          {getApplicant(application.data as Application, t)}
        </Applicant>
        {modified(application, t)}
        <TwoColumnContainer>
          <div>
            <SubHeading>{t('Reservations.titleResolution')}</SubHeading>
            <ResolutionDescription>
              {reservationsResultText}
            </ResolutionDescription>

            {status === 'error' ? (
              <Notification
                type="error"
                label={t('Reservations.errorGeneratingPDF')}
                position="top-center"
                displayAutoCloseProgress={false}
                autoClose
                onClose={() => setStatus('done')}>
                {t('Reservations.errorGeneratingPDF')}
              </Notification>
            ) : (
              <ToggleButton
                theme="black"
                variant="secondary"
                iconLeft={<IconDownload />}
                isLoading={status === 'loading'}
                loadingText={t('Reservations.generating')}
                onClick={() => {
                  setStatus('loading');
                  setTimeout(() => {
                    import('../pdf/util').then(({ download }) => {
                      download(
                        application.data as Application,
                        reservations.data as RecurringReservation[],
                        applicationRound.data?.approvedBy || null,
                        setStatus
                      );
                    });
                  }, 0);
                }}>
                {t('Reservations.download')}
              </ToggleButton>
            )}
          </div>
          {hasReservations ? (
            <Buttons>
              <ToggleButton
                theme="black"
                aria-pressed={isCalendar}
                variant={(isCalendar && 'secondary') || 'primary'}
                iconLeft={<IconMenuHamburger />}
                onClick={() => setIsCalendar(false)}>
                {t('Reservations.showList')}
              </ToggleButton>
              <ToggleButton
                theme="black"
                variant={(isCalendar && 'primary') || 'secondary'}
                aria-pressed={!isCalendar}
                onClick={() => setIsCalendar(true)}
                iconLeft={<IconCalendar />}>
                {t('Reservations.showCalendar')}
              </ToggleButton>
            </Buttons>
          ) : null}
        </TwoColumnContainer>
        {hasReservations ? (
          <ReservationsView
            application={application}
            isCalendar={isCalendar}
            reservations={reservations}
          />
        ) : null}
      </Loader>
    </Container>
  );
};

export default Reservations;
