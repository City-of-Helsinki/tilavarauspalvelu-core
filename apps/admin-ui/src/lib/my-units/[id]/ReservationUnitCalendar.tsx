import React from "react";
import { toApiDate } from "common/src/common/util";
import CommonCalendar from "common/src/calendar/Calendar";
import { get } from "lodash-es";
import { addDays, endOfISOWeek, startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { type TFunction, useTranslation } from "next-i18next";
import {
  ReservationTypeChoice,
  type ReservationUnitCalendarQuery,
  useReservationUnitCalendarQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import { useSlotPropGetter } from "common/src/calendar/util";
import { getReservationUrl } from "@/common/urls";
import { Legend, LegendsWrapper } from "@/component/Legend";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { createNodeId, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { getReserveeName } from "@/common/util";
import { errorToast } from "common/src/components/toast";
import { useCheckPermission } from "@/hooks";
import { gql } from "@apollo/client";
import { combineAffectingReservations } from "@/helpers";

type Props = {
  begin: string;
  reservationUnitPk: number;
  unitPk: number;
};

const Container = styled.div`
  .rbc-event-label {
    font-weight: 700;
  }
`;

type ReservationUnitType = NonNullable<ReservationUnitCalendarQuery["reservationUnit"]>;
type ReservationType = NonNullable<NonNullable<ReservationUnitType["reservations"]>[0]>;

function getEventTitle({
  reservationUnitPk,
  reservation,
  t,
}: {
  reservationUnitPk: number;
  reservation: ReservationType;
  t: TFunction;
}) {
  const reserveeName = getReserveeName(reservation, t);

  if (reservationUnitPk !== reservation.reservationUnit.pk) {
    const reservationUnitName = reservation.reservationUnit.nameFi ?? "";

    return [reserveeName, reservationUnitName];
  }

  return [reserveeName, ""];
}

function constructEventTitle(res: ReservationType, resUnitPk: number, t: TFunction) {
  const [reservee, unit] = getEventTitle({
    reservationUnitPk: resUnitPk,
    reservation: res,
    t,
  });
  if (unit != null && unit.length > 0) {
    return `${reservee} (${unit})`;
  }
  return reservee;
}

export function ReservationUnitCalendar({ begin, reservationUnitPk, unitPk }: Props): JSX.Element {
  const { t } = useTranslation();
  const { hasPermission } = useCheckPermission({
    units: [unitPk],
    permission: UserPermissionChoice.CanViewReservations,
  });

  const calendarEventExcludedLegends = ["RESERVATION_UNIT_RELEASED", "RESERVATION_UNIT_DRAFT"];

  const beginDate = new Date(begin);
  const { data, loading: isLoading } = useReservationUnitCalendarQuery({
    fetchPolicy: "network-only",
    skip: reservationUnitPk === 0,
    variables: {
      id: createNodeId("ReservationUnitNode", reservationUnitPk),
      pk: reservationUnitPk,
      state: RELATED_RESERVATION_STATES,
      beginDate: toApiDate(startOfISOWeek(beginDate)) ?? "",
      endDate: toApiDate(addDays(endOfISOWeek(beginDate), 1)) ?? "",
    },
    onError: () => {
      errorToast({
        text: t("errors:errorFetchingData"),
      });
    },
  });

  const reservations = combineAffectingReservations(data, reservationUnitPk);

  const events = reservations.map((reservation) => {
    const isBlocked = reservation.type === ReservationTypeChoice.Blocked;
    const title = !isBlocked
      ? constructEventTitle(reservation, reservationUnitPk, t)
      : t("myUnits:Calendar.legend.closed");
    return {
      title,
      event: reservation,
      start: new Date(get(reservation, "beginsAt")),
      end: new Date(get(reservation, "endsAt")),
    };
  });

  const slotPropGetter = useSlotPropGetter(
    filterNonNullable(data?.reservationUnit?.reservableTimeSpans),
    filterNonNullable(reservations)
  );

  return (
    <Container>
      <CommonCalendar
        events={events}
        slotPropGetter={slotPropGetter}
        begin={startOfISOWeek(beginDate)}
        eventStyleGetter={eventStyleGetter(reservationUnitPk)}
        isLoading={isLoading}
        onSelectEvent={(e) => {
          if (hasPermission) {
            window.open(getReservationUrl(e.event?.pk, true), "_blank");
          }
        }}
        underlineEvents
      />
      <LegendsWrapper>
        {legend
          .filter((l) => !calendarEventExcludedLegends.includes(l.key))
          .map((l) => (
            <Legend key={l.label} style={l.style} label={t(l.label)} />
          ))}
      </LegendsWrapper>
    </Container>
  );
}

export const RESERVATION_UNIT_CALENDAR_QUERY = gql`
  query ReservationUnitCalendar(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice]
    $beginDate: Date!
    $endDate: Date!
  ) {
    reservationUnit(id: $id) {
      id
      pk
      reservations(state: $state, beginDate: $beginDate, endDate: $endDate) {
        ...ReservationUnitReservations
        ...CombineAffectedReservations
      }
      reservableTimeSpans(startDate: $beginDate, endDate: $endDate) {
        startDatetime
        endDatetime
      }
    }
    affectingReservations(forReservationUnits: [$pk], state: $state, beginDate: $beginDate, endDate: $endDate) {
      ...ReservationUnitReservations
      ...CombineAffectedReservations
    }
  }
`;
