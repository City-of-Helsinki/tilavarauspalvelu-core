import React from 'react';
import { ApiData } from '../common/hook/useApiData';
import { Application, RecurringReservation } from '../common/types';
import { HorisontalRule } from '../component/common';
import EventSummaryForCalendar from './EventSummaryForCalendar';
import EventSummaryForList from './EventSummaryForList';

type Props = {
  isCalendar: boolean;
  application: ApiData<Application, unknown>;
  reservations: ApiData<RecurringReservation[], unknown>;
};

const ReservationsView = ({
  isCalendar,
  application,
  reservations,
}: Props): JSX.Element => {
  return (
    <>
      <HorisontalRule />
      {application.data?.applicationEvents.map((event) =>
        isCalendar ? (
          <EventSummaryForCalendar
            key={event.id}
            applicationEvent={event}
            reservations={reservations}
          />
        ) : (
          <EventSummaryForList
            key={event.id}
            applicationEvent={event}
            reservations={reservations}
          />
        )
      )}
    </>
  );
};

export default ReservationsView;
