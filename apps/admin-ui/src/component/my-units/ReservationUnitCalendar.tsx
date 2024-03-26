import React from "react";
import { toApiDate } from "common/src/common/util";
import CommonCalendar from "common/src/calendar/Calendar";
import { useQuery } from "@apollo/client";
import { get } from "lodash";
import { addDays, endOfISOWeek, startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  type Query,
  type ReservationNode,
  ReservationTypeChoice,
  type QueryReservationUnitArgs,
  type ReservationUnitNodeReservationSetArgs,
} from "common/types/gql-types";
import { Permission } from "app/modules/permissionHelper";
import usePermission from "app/hooks/usePermission";
import { getEventBuffers } from "common/src/calendar/util";
import { reservationUrl } from "../../common/urls";
import { useNotification } from "../../context/NotificationContext";
import Legend from "../reservations/requested/Legend";
import { RESERVATIONS_BY_RESERVATIONUNITS } from "./queries";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { PUBLIC_URL } from "../../common/const";
import { getReserveeName } from "../reservations/requested/util";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";

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

const getEventTitle = ({
  reservationUnitPk,
  reservation,
}: {
  reservationUnitPk: number;
  reservation: ReservationNode;
}) => {
  const reservationUnit = reservation.reservationUnit?.[0];
  const isOtherReservationUnit = reservationUnitPk !== reservationUnit?.pk;

  const reserveeName = getReserveeName(reservation);
  if (isOtherReservationUnit) {
    const reservationUnitName = reservationUnit?.nameFi ?? "";

    return [reserveeName, reservationUnitName];
  }

  return [reserveeName, ""];
};

const constructEventTitle = (res: ReservationNode, resUnitPk: number) => {
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
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const calendarEventExcludedLegends = [
    "RESERVATION_UNIT_RELEASED",
    "RESERVATION_UNIT_DRAFT",
  ];

  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${reservationUnitPk}`);
  const { data } = useQuery<
    Query,
    QueryReservationUnitArgs & ReservationUnitNodeReservationSetArgs
  >(RESERVATIONS_BY_RESERVATIONUNITS, {
    fetchPolicy: "network-only",
    skip: reservationUnitPk === 0,
    variables: {
      id,
      state: RELATED_RESERVATION_STATES,
      beginDate: toApiDate(startOfISOWeek(new Date(begin))) ?? "",
      endDate: toApiDate(addDays(endOfISOWeek(new Date(begin)), 1)) ?? "",
    },
    onError: () => {
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const reservations = filterNonNullable(data?.reservationUnit?.reservationSet);
  const events = reservations.map((reservation) => {
    const isBlocked = reservation.type === ReservationTypeChoice.Blocked;
    const title = !isBlocked
      ? constructEventTitle(reservation, reservationUnitPk)
      : t("MyUnits.Calendar.legend.closed");
    return {
      title,
      event: reservation,
      start: new Date(get(reservation, "begin")),
      end: new Date(get(reservation, "end")),
    };
  });

  const { hasPermission } = usePermission();

  const evts = filterNonNullable(events.map((e) => e.event)).filter(
    (e) => e.type !== ReservationTypeChoice.Blocked
  );
  const eventBuffers = getEventBuffers(evts);

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
