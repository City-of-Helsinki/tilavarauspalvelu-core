import React, { useEffect, useState } from "react";
import { toApiDate } from "common/src/common/util";
import CommonCalendar, { CalendarEvent } from "common/src/calendar/Calendar";
import { useQuery } from "@apollo/client";
import { get } from "lodash";
import { addDays, endOfISOWeek, startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  type Query,
  type ReservationType,
  type ReservationUnitByPkTypeReservationsArgs,
  type QueryReservationUnitByPkArgs,
  Type,
} from "common/types/gql-types";
import { Permission } from "app/modules/permissionHelper";
import usePermission from "app/hooks/usePermission";
import { getEventBuffers } from "common/src/calendar/util";
import { reservationUrl } from "../../common/urls";
import { combineResults } from "../../common/util";
import { useNotification } from "../../context/NotificationContext";
import Legend from "../reservations/requested/Legend";
import { RESERVATIONS_BY_RESERVATIONUNITS } from "./queries";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { PUBLIC_URL } from "../../common/const";
import { getReserveeName } from "../reservations/requested/util";

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

const getEventTitle = ({
  reservationUnitPk,
  reservation,
}: {
  reservationUnitPk: number;
  reservation: ReservationType;
}) => {
  const reservationUnit = reservation.reservationUnits?.[0];
  const isOtherReservationUnit = reservationUnitPk !== reservationUnit?.pk;

  const reserveeName = getReserveeName(reservation);
  if (isOtherReservationUnit) {
    const reservationUnitName = reservationUnit?.nameFi ?? "";

    return [reserveeName, reservationUnitName];
  }

  return [reserveeName, ""];
};

const constructEventTitle = (res: ReservationType, resUnitPk: number) => {
  const [reservee, unit] = getEventTitle({
    reservationUnitPk: resUnitPk,
    reservation: res,
  });
  if (unit.length > 0) {
    return `${reservee} (${unit})`;
  }
  return reservee;
};

const ReservationUnitCalendar = ({
  begin,
  reservationUnitPk,
}: Props): JSX.Element => {
  const [events, setEvents] = useState<CalendarEvent<ReservationType>[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const calendarEventExcludedLegends = [
    "RESERVATION_UNIT_RELEASED",
    "RESERVATION_UNIT_DRAFT",
  ];

  const { fetchMore } = useQuery<
    Query,
    QueryReservationUnitByPkArgs & ReservationUnitByPkTypeReservationsArgs
  >(RESERVATIONS_BY_RESERVATIONUNITS, {
    fetchPolicy: "network-only",
    variables: {
      pk: reservationUnitPk,
      from: toApiDate(startOfISOWeek(new Date(begin))),
      to: toApiDate(addDays(endOfISOWeek(new Date(begin)), 1)),
      includeWithSameComponents: true,
    },
    onCompleted: ({ reservationUnits }) => {
      const ru = reservationUnits?.edges?.[0]?.node;
      const reservations: ReservationType[] =
        ru?.reservations?.filter((item): item is ReservationType => !!item) ||
        [];

      setEvents(
        reservations.map((reservation) => {
          const title =
            reservation.type !== Type.Blocked
              ? constructEventTitle(reservation, reservationUnitPk)
              : t("MyUnits.Calendar.legend.closed");
          return {
            title,
            event: reservation,
            start: new Date(get(reservation, "begin")),
            end: new Date(get(reservation, "end")),
          };
        })
      );
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

  const { hasPermission } = usePermission();

  const eventBuffers = events
    ? getEventBuffers(
        events
          .map((e) => e.event)
          .filter((e) => e?.type !== Type.Blocked)
          .filter((e): e is ReservationType => e != null)
      )
    : [];

  return (
    <Container>
      <CommonCalendar
        events={[...events, ...eventBuffers]}
        begin={startOfISOWeek(new Date(begin))}
        eventStyleGetter={eventStyleGetter(reservationUnitPk)}
        onSelectEvent={(e) => {
          if (
            e.event?.pk &&
            hasPermission(e.event, Permission.CAN_VIEW_RESERVATIONS)
          ) {
            // TODO this looks dangerous, does public url end in slash or not?
            // TODO use an url builder
            window.open(PUBLIC_URL + reservationUrl(e.event?.pk), "_blank");
          }
        }}
        underlineEvents
      />
      <Legends>
        {legend
          .filter((l) => !calendarEventExcludedLegends.includes(l.key))
          .map((l) => (
            <Legend key={l.label} style={l.style} label={t(l.label)} />
          ))}
      </Legends>
    </Container>
  );
};

export default ReservationUnitCalendar;
