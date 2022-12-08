import React, { useEffect, useState } from "react";
import CommonCalendar, { CalendarEvent } from "common/src/calendar/Calendar";
import { useQuery } from "@apollo/client";
import { startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  Query,
  QueryReservationsArgs,
  ReservationsReservationStateChoices,
  ReservationType,
} from "common/types/gql-types";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { RESERVATIONS_BY_RESERVATIONUNIT } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import Legend from "./Legend";
import { reservationUrl } from "../../../common/urls";
import { combineResults } from "../../../common/util";

type Props = {
  begin: string;
  reservationUnitPk: string;
  reservation: ReservationType;
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
  reservation,
}: Props): JSX.Element => {
  const [events, setEvents] = useState([] as CalendarEvent<ReservationType>[]);
  const [hasMore, setHasMore] = useState(false);
  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const { fetchMore } = useQuery<Query, QueryReservationsArgs>(
    RESERVATIONS_BY_RESERVATIONUNIT,

    {
      fetchPolicy: "network-only",
      variables: {
        offset: 0,
        first: 100,
        reservationUnit: [reservationUnitPk],
        begin,
        end: begin,
      },
      onCompleted: ({ reservations }) => {
        if (reservations) {
          const formattedReservations = reservations?.edges
            .filter(
              (r) =>
                [
                  ReservationsReservationStateChoices.Confirmed,
                  ReservationsReservationStateChoices.RequiresHandling,
                ].includes(
                  r?.node?.state as ReservationsReservationStateChoices
                ) || r?.node?.pk === reservation.pk
            )
            .map((r) =>
              r?.node && r.node.begin && r.node.end
                ? ({
                    title: `${
                      r?.node?.reserveeOrganisationName ||
                      `${r?.node?.reserveeFirstName || ""} ${
                        r?.node?.reserveeLastName || ""
                      }`
                    }`,
                    event: r?.node as ReservationType,
                    start: new Date(r.node.begin),
                    end: new Date(r.node.end),
                  } as CalendarEvent<ReservationType>)
                : undefined
            )
            .filter((item): item is CalendarEvent<ReservationType> => !!item);

          setEvents(formattedReservations);

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
        eventStyleGetter={eventStyleGetter(reservation)}
        onSelectEvent={(e) => {
          if (e.event?.pk !== reservation.pk) {
            window.open(reservationUrl(e.event?.pk as number), "_blank");
          }
        }}
      />
      <Legends>
        {legend.map((l) => (
          <Legend key={l.label} style={l.style} label={t(l.label)} />
        ))}
      </Legends>{" "}
    </Container>
  );
};

export default Calendar;
