import { IconLocation } from 'hds-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  getApplication,
  getApplicationRound,
  getRecurringReservations,
} from '../common/api';
import { useApiData } from '../common/hook/useApiData';
import { breakpoint } from '../common/style';
import { Strong } from '../common/Typography';
import Back from '../component/Back';
import { HorisontalRule } from '../component/common';
import Loader from '../component/Loader';
import IconWithText from '../reservation-unit/IconWithText';
import ReservationList from './ReservationList';
import { localizedValue } from '../common/util';

const EventName = styled.h1`
  font-size: var(--fontsize-heading-l);
  font-family: var(--font-bold);
`;

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
  margin-top: var(--spacing-s);
  font-size: var(--fontsize-body-m);
`;

const BuildingName = styled(Strong)`
  font-size: var(--fontsize-heading-m);
  margin-right: var(--spacing-s);
`;

const ReservationUnitName = styled.span`
  font-size: var(--fontsize-heading-s);
`;

type ParamTypes = {
  applicationId: string;
  reservationUnitId: string;
  eventId: string;
};

const EventReservationUnitDetails = (): JSX.Element | null => {
  const { applicationId, reservationUnitId, eventId } = useParams<ParamTypes>();

  const { t, i18n } = useTranslation();

  const application = useApiData(getApplication, Number(applicationId));

  const applicationRound = useApiData(
    getApplicationRound,
    application.data ? { id: application.data.applicationRoundId } : undefined
  );

  const reservations = useApiData(
    getRecurringReservations,
    Number(applicationId)
  );

  const unitReservations = reservations.data
    ?.filter((recurring) => recurring.applicationEventId === Number(eventId))
    .flatMap((recurringreservations) => recurringreservations.reservations)
    .filter((reservation) =>
      Boolean(
        reservation.reservationUnit.find(
          (unit) => unit.id === Number(reservationUnitId)
        )
      )
    );

  const applicationEvent = application.data?.applicationEvents.find(
    (event) => event.id === Number(eventId)
  );

  const reservationUnit = unitReservations
    ?.flatMap((reservation) => reservation.reservationUnit)
    .find((ru) => ru.id === Number(reservationUnitId));

  return (
    <Container>
      <Back label="EventReservationUnitDetails.back" />
      <Loader datas={[application, applicationRound, reservations]}>
        <EventName>{applicationEvent?.name}</EventName>
        <Strong>{t('EventReservationUnitDetails.reservations')}</Strong>
        <RoundName>{applicationRound.data?.name}</RoundName>
        <HorisontalRule />
        <IconWithText
          icon={
            <IconLocation
              size="s"
              aria-label="{t('EventReservationUnitDetails.ariaLabelLocation')}"
            />
          }
          text={
            <div>
              <BuildingName>{reservationUnit?.building.name}</BuildingName>
              <ReservationUnitName>
                {localizedValue(reservationUnit?.name, i18n.language)}
              </ReservationUnitName>
            </div>
          }
        />
        <ReservationList
          groupName={applicationEvent?.name as string}
          reservations={unitReservations}
        />
      </Loader>
    </Container>
  );
};

export default EventReservationUnitDetails;
