import React, { useEffect, useState } from "react";
import { toApiDate } from "common/src/common/util";
import CommonCalendar, { CalendarEvent } from "common/src/calendar/Calendar";
import { useQuery } from "@apollo/client";
import { get } from "lodash";
import { addDays, endOfISOWeek, startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  Query,
  ReservationType,
  ReservationUnitByPkTypeReservationsArgs,
  QueryReservationUnitByPkArgs,
} from "common/types/gql-types";
import { reservationUrl } from "../../common/urls";
import { combineResults } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import Legend from "../reservations/requested/Legend";
import { RESERVATIONS_BY_RESERVATIONUNITS } from "./queries";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { publicUrl } from "../../common/const";

type Props = {
  begin: string;
  reservationUnitPk: number;
};

const Legends = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  padding: var(--spacing-m) 0;
`;

const Container = styled.div`
  .rbc-event-label {
    font-weight: 700;
  }
`;

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "reservations");
};

const ReservationUnitCalendar = ({
  begin,
  reservationUnitPk,
}: Props): JSX.Element => {
  const [events, setEvents] = useState([] as CalendarEvent<ReservationType>[]);
  const [hasMore, setHasMore] = useState(false);
  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const { fetchMore } = useQuery<
    Query,
    QueryReservationUnitByPkArgs & ReservationUnitByPkTypeReservationsArgs
  >(RESERVATIONS_BY_RESERVATIONUNITS, {
    fetchPolicy: "network-only",
    variables: {
      pk: reservationUnitPk,
      from: toApiDate(startOfISOWeek(new Date(begin))),
      to: toApiDate(addDays(endOfISOWeek(new Date(begin)), 1)),
    },
    onCompleted: ({ reservationUnitByPk }) => {
      const reservations =
        reservationUnitByPk?.reservations?.filter(
          (item): item is ReservationType => !!item
        ) || [];

      if (reservations) {
        setEvents(
          reservations.map((reservation) => ({
            title: `${
              reservation.reserveeOrganisationName ||
              `${reservation.reserveeFirstName || ""} ${
                reservation.reserveeLastName || ""
              }`
            }`,
            event: reservation as ReservationType,
            start: new Date(get(reservation, "begin")),
            end: new Date(get(reservation, "end")),
          }))
        );
      }
    },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });
  useEffect(() => {
    if (hasMore) {
      setHasMore(false);
      fetchMore({
        variables: {
          offset: events.length,
        },
        updateQuery,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, setHasMore]);

  return (
    <Container>
      <CommonCalendar
        events={events}
        begin={startOfISOWeek(new Date(begin))}
        eventStyleGetter={eventStyleGetter(reservationUnitPk)}
        onSelectEvent={(e) => {
          window.open(
            publicUrl + reservationUrl(e.event?.pk as number),
            "_blank"
          );
        }}
      />
      <Legends>
        {legend.map((l) => (
          <Legend key={l.label} style={l.style} label={t(l.label)} />
        ))}
      </Legends>
    </Container>
  );
};

export default ReservationUnitCalendar;
