import {
  Button,
  IconArrowRight,
  IconCalendar,
  IconCalendarPlus,
  IconClock,
  IconInfoCircle,
} from 'hds-react';
import { uniq } from 'lodash';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { getParameters } from '../common/api';
import { ApiData, useApiData } from '../common/hook/useApiData';
import { breakpoint } from '../common/style';
import {
  ApplicationEvent,
  Parameter,
  RecurringReservation,
  Reservation,
  ReservationUnit,
} from '../common/types';
import { Strong } from '../common/Typography';
import { formatDurationMinutes, parseDate } from '../common/util';
import { HorisontalRule, SpanTwoColumns } from '../component/common';
import Loader from '../component/Loader';
import DefaultIconWithText from '../reservation-unit/IconWithText';

type Props = {
  applicationEvent: ApplicationEvent;
  reservations: ApiData<RecurringReservation[], unknown>;
};

const SummaryContainer = styled.div`
  margin-right: var(--spacing-layout-l);
  margin-left: var(--spacing-layout-l);
  @media (max-width: ${breakpoint.l}) {
    margin-right: initial;
    margin-left: initial;
  }
`;

const IconWithText = styled(DefaultIconWithText)`
  margin-top: 0;
`;

const WeekDay = styled.span`
  border: 2px solid var(--color-black);
  padding: 0.2rem var(--spacing-s);
  margin-right: var(--spacing-s);
`;

const SpacerRow = styled.div`
  grid-column-start: 1;
  grid-column-end: 4;
`;

const EventName = styled.div`
  font-family: var(--font-bold);
  font-size: var(--fontsize-heading-m);
  margin-bottom: var(--spacing-m);
  margin-top: var(--spacing-layout-m);
`;

const Container = styled.div`
  display: grid;
  font-family: var(--font-regular);
  grid-template-columns: 10em 10em 1fr;
  gap: var(--spacing-xs);
  @media (max-width: ${breakpoint.m}) {
    display: block;
    gap: 0;
  }
`;

const Actions = styled.div`
  margin-top: var(--spacing-layout-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  font-family: var(--font-bold);
  @media (max-width: ${breakpoint.m}) {
    display: block;
  }
`;

const Exceptions = styled.div`
  margin-top: var(--spacing-xl);
`;

const Label = styled.div`
  margin-bottom: var(--spacing-xs);
  @media (max-width: ${breakpoint.m}) {
    margin-top: var(--spacing-s);
    margin-bottom: 5px;
  }
`;

const StrongLabel = styled.div`
  font-family: var(--font-bold);
  @media (max-width: ${breakpoint.m}) {
    margin-top: var(--spacing-s);
    margin-bottom: 5px;
  }
`;

const ExceptionItems = styled.div`
  font-family: var(--font-regular);
  margin-top: var(--spacing-s);
`;

const Gray = styled.div`
  color: var(--color-black-60);
`;

const TimeSpan = styled.div`
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 8em 2.7em 1fr;
  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 6em 1em 6em;
  }
`;

const HideSmall = styled.div`
  @media (max-width: ${breakpoint.m}) {
    display: none;
  }
`;

const ReservationUnitEventsSummaryForList = ({
  applicationEvent,
  reservations,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  const purposes = useApiData(getParameters, 'purpose');

  const history = useHistory();

  const eventReservations =
    reservations.data
      ?.filter(
        (recurringreservation) =>
          recurringreservation.applicationEventId === applicationEvent.id
      )
      .flatMap((rr) => rr.reservations) || [];

  const keys = [] as ReservationUnit[];
  const resUnitEvents = eventReservations.reduce((prev, reservation) => {
    reservation.reservationUnit.forEach((resUnit) => {
      let key = keys.find((k) => k.id === resUnit.id);
      if (!key) {
        keys.push(resUnit);
        key = resUnit;
      }

      const resUnitArray = prev.get(key);
      if (resUnitArray) {
        resUnitArray.push(reservation);
      } else {
        prev.set(key, [reservation]);
      }
    });

    return prev;
  }, new Map<ReservationUnit, Reservation[]>());

  const getPurpose = (id: number): Parameter | undefined => {
    return purposes.data?.find((param) => param.id === id);
  };

  return (
    <SummaryContainer>
      <Loader datas={[purposes]}>
        {Array.from(resUnitEvents.entries()).map(
          ([reservationUnit, resUnitReservations]) => {
            const weekDays = uniq(
              resUnitReservations.map((reservation) =>
                parseDate(reservation.begin).getDay()
              )
            ).sort((a, b) => a - b);

            resUnitReservations.sort(
              (a, b) =>
                parseDate(a.begin).getTime() + parseDate(b.begin).getTime()
            );

            const firstDate = parseDate(resUnitReservations[0].begin);
            const lastDate = parseDate(
              resUnitReservations[resUnitReservations.length - 1].end
            );

            // asuming all events are of equal length
            const begin = parseDate(resUnitReservations[0].begin);
            const end = parseDate(resUnitReservations[0].end);

            return (
              <Fragment
                key={
                  (reservationUnit.id,
                  resUnitReservations.map((r) => r.id).join('-'))
                }>
                <EventName>{applicationEvent.name}</EventName>
                <Container>
                  <StrongLabel>{t('EventSummary.space')}</StrongLabel>
                  <SpanTwoColumns>
                    {reservationUnit.building.name}, {reservationUnit.name.fi}
                  </SpanTwoColumns>
                  <StrongLabel>{t('EventSummary.purpose')}</StrongLabel>
                  <SpanTwoColumns>
                    {getPurpose(applicationEvent.purposeId as number)?.name}
                  </SpanTwoColumns>
                  <SpacerRow />
                  <div>
                    <Label>{t('EventSummary.begin')}</Label>
                    <Strong>
                      <IconWithText
                        icon={<IconCalendar aria-hidden />}
                        text={t('common.date', { date: firstDate })}
                      />
                    </Strong>
                  </div>
                  <div>
                    <Label>{t('EventSummary.end')}</Label>
                    <Strong>
                      <IconWithText
                        icon={<IconCalendar aria-hidden />}
                        text={t('common.date', { date: lastDate })}
                      />
                    </Strong>
                  </div>
                  <div>
                    <Label>{t('EventSummary.weekDay')}</Label>
                    <div>
                      {weekDays.map((wd) => (
                        <WeekDay>{t(`common.weekDay.${wd}`)}</WeekDay>
                      ))}{' '}
                      {t(
                        applicationEvent.biweekly
                          ? 'EventSummary.everyOtherWeek'
                          : 'EventSummary.everyWeek'
                      )}
                    </div>
                  </div>
                  <SpacerRow />
                  <SpanTwoColumns>
                    <Label>{t('EventSummary.time')}</Label>
                    <Strong>
                      <TimeSpan>
                        <IconWithText
                          icon={<IconClock aria-hidden />}
                          text={t('common.time', { date: begin })}
                        />
                        <span>-</span>
                        <IconWithText
                          icon={<IconClock aria-hidden />}
                          text={t('common.time', { date: end })}
                        />
                      </TimeSpan>
                    </Strong>
                  </SpanTwoColumns>
                  <Gray>
                    <HideSmall>
                      <Label>&nbsp;</Label>
                    </HideSmall>
                    <IconWithText
                      icon={<IconInfoCircle aria-hidden />}
                      text={t('EventSummary.duration', {
                        duration: formatDurationMinutes(
                          (end.getTime() - begin.getTime()) / 1000 / 60
                        ),
                      })}
                    />
                  </Gray>
                </Container>
                {resUnitReservations.filter(
                  (reservation) => reservation.state === 'denied'
                ).length ? (
                  <Exceptions>
                    <Strong>{t('EventSummary.notAvailable')}</Strong>
                    <ExceptionItems>
                      {resUnitReservations
                        .filter((reservation) => reservation.state === 'denied')
                        .map((reservation) => (
                          <div>
                            {t('common.dateLong', {
                              date: parseDate(reservation.begin),
                            })}
                          </div>
                        ))}
                    </ExceptionItems>
                  </Exceptions>
                ) : null}
                <Actions>
                  <IconWithText
                    icon={<IconCalendarPlus aria-hidden />}
                    text={`${reservationUnit.building.name}, ${reservationUnit.name.fi}`}
                  />
                  <div>
                    <Button
                      theme="black"
                      variant="supplementary"
                      iconLeft={<IconCalendar aria-hidden />}
                      iconRight={<IconArrowRight aria-hidden />}
                      onClick={() =>
                        history.push(
                          `/applications/details/${applicationEvent.applicationId}/${applicationEvent.id}/${reservationUnit.id}`
                        )
                      }>
                      {t('EventSummary.showList')}
                    </Button>
                  </div>
                </Actions>
                <HorisontalRule />
              </Fragment>
            );
          }
        )}
      </Loader>
    </SummaryContainer>
  );
};

export default ReservationUnitEventsSummaryForList;
