import React, { useEffect, useState } from "react";
import CommonCalendar, { CalendarEvent } from "common/src/calendar/Calendar";
import { useQuery } from "@apollo/client";
import { get } from "lodash";
import { endOfISOWeek, startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { reservationUrl } from "../../common/urls";
import {
  Query,
  QueryReservationsArgs,
  ReservationType,
} from "../../common/gql-types";
import { combineResults } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import Legend from "../reservations/requested/Legend";
import { RESERVATIONS_BY_RESERVATIONUNITS } from "./queries";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { publicUrl } from "../../common/const";

type Props = {
  begin: string;
  intersectingReservationUnits: number[];
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

const Calendar = ({
  begin,
  reservationUnitPk,
  intersectingReservationUnits,
}: Props): JSX.Element => {
  const [events, setEvents] = useState([] as CalendarEvent<ReservationType>[]);
  const [hasMore, setHasMore] = useState(false);
  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const { fetchMore } = useQuery<Query, QueryReservationsArgs>(
    RESERVATIONS_BY_RESERVATIONUNITS,

    {
      fetchPolicy: "network-only",
      variables: {
        offset: 0,
        first: 100,
        reservationUnit: intersectingReservationUnits.map(String),
        begin: startOfISOWeek(new Date(begin)),
        end: endOfISOWeek(new Date(begin)),
      },
      onCompleted: ({ reservations }) => {
        if (reservations) {
          setEvents(
            (reservations?.edges || []).map((r) => ({
              title: `${
                r?.node?.reserveeOrganisationName ||
                `${r?.node?.reserveeFirstName || ""} ${
                  r?.node?.reserveeLastName || ""
                }`
              }`,
              event: r?.node as ReservationType,
              start: new Date(get(r?.node, "begin")),
              end: new Date(get(r?.node, "end")),
            }))
          );

          if (reservations.pageInfo.hasNextPage) {
            setHasMore(true);
          }
        }
      },
      onError: () => {
        notifyError("Varauksia ei voitu hakea");
      },
    }
  );
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

export default Calendar;
