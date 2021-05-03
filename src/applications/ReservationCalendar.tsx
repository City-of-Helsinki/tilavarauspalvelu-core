import { addHours, endOfMonth, format, getDay } from 'date-fns';
import fi from 'date-fns/locale/fi';
import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { reservationUnitPath } from '../common/const';
import { breakpoint } from '../common/style';
import {
  ApplicationEvent,
  Reservation,
  ReservationUnit,
} from '../common/types';
import { localizedValue, parseDate, startOfWeek } from '../common/util';
import ExtrenalLink from '../reservation-unit/ExternalLink';

const locales = {
  fi,
};

type Props = {
  reservations?: Reservation[];
  begin: Date;
  applicationEvent: ApplicationEvent;
  reservationUnit: ReservationUnit;
};

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const Legends = styled.div`
  margin-top: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 3fr 1fr 7fr;
  gap: 1em;

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 3fr;
  }
`;

const Ok = styled.div`
  color: var(--color-white);
  padding: var(--spacing-xs);
  height: var(--spacing-m);
  width: var(--spacing-layout-xl);
  background-color: var(--color-success-dark);
`;

const Cancelled = styled.div`
  color: var(--color-white);
  padding: var(--spacing-xs);
  height: var(--spacing-m);
  text-decoration: line-through;
  width: var(--spacing-layout-xl);
  background-color: var(--color-error-dark);
`;

const Label = styled.div`
  padding: var(--spacing-xs);
  height: var(--spacing-m);
`;

const eventStyleGetter = (event: { reservation: Reservation }) => {
  const style = {
    borderRadius: '0px',
    opacity: 0.8,
    color: 'var(--color-white)',
    display: 'block',
  } as React.CSSProperties;

  const { reservation } = event;
  style.backgroundColor =
    reservation.state === 'cancelled'
      ? 'var(--color-error-dark)'
      : 'var(--color-success-dark)';

  if (reservation.state === 'cancelled') {
    style.textDecoration = 'line-through';
  }

  return {
    style,
  };
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const ignore = () => {};

const ReservationCalendar = ({
  begin,
  reservations,
  applicationEvent,
  reservationUnit,
}: Props): JSX.Element | null => {
  const localizer = dateFnsLocalizer({
    format,
    parse: parseDate,
    startOfWeek,
    getDay,
    locales,
  });
  const { i18n, t } = useTranslation();

  return (
    <Container>
      <Calendar
        culture={i18n.language}
        formats={{ dayFormat: 'EEEEEE d.M.yyyy' }}
        eventPropGetter={eventStyleGetter}
        events={reservations?.map((r) => {
          const event = {
            title: `${
              r.state === 'cancelled'
                ? `${t('ReservationCalendar.prefixForCancelled')}: `
                : ''
            } ${applicationEvent.name}: ${localizedValue(
              reservationUnit.name,
              i18n.language
            )}`,
            start: parseDate(r.begin),
            end: parseDate(r.end),
            allDay: false,
            reservation: r,
          };

          return event;
        })}
        date={begin}
        onNavigate={ignore}
        view="week"
        onView={ignore}
        min={addHours(begin, 7)}
        max={endOfMonth(begin)}
        localizer={localizer}
        toolbar={false}
      />
      <Legends>
        <Ok>11.00-12:00</Ok>
        <Label>{t('ReservationCalendar.legend.okLabel')}</Label>
        <Cancelled>11.00 -12:45</Cancelled>
        <Label>{t('ReservationCalendar.legend.cancelledLabel')}</Label>
      </Legends>
      <ExtrenalLink
        href={reservationUnitPath(reservationUnit.id)}
        name={t('ReservationCalendar.linkToResourceUnitLabel')}
      />
    </Container>
  );
};

export default ReservationCalendar;
