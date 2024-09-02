import React from "react";
import { toApiDate } from "common/src/common/util";
import CommonCalendar from "common/src/calendar/Calendar";
import { get } from "lodash";
import { addDays, endOfISOWeek, startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { type TFunction, useTranslation } from "next-i18next";
import {
  ReservationTypeChoice,
  UserPermissionChoice,
  useReservationUnitCalendarQuery,
  type ReservationUnitCalendarQuery,
} from "@gql/gql-types";
import { getEventBuffers } from "common/src/calendar/util";
import { getReservationUrl } from "@/common/urls";
import Legend from "@/component/Legend";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { getReserveeName } from "@/common/util";
import { errorToast } from "common/src/common/toast";
import { useCheckPermission } from "@/hooks";

type Props = {
  begin: string;
  reservationUnitPk: number;
  unitPk: number;
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

type ReservationUnitType = NonNullable<
  ReservationUnitCalendarQuery["reservationUnit"]
>;
type ReservationType = NonNullable<
  NonNullable<ReservationUnitType["reservationSet"]>[0]
>;

function getEventTitle({
  reservationUnitPk,
  reservation,
  t,
}: {
  reservationUnitPk: number;
  reservation: ReservationType;
  t: TFunction;
}) {
  const reservationUnit = reservation.reservationUnit?.[0];
  const isOtherReservationUnit = reservationUnitPk !== reservationUnit?.pk;

  const reserveeName = getReserveeName(reservation, t);
  if (isOtherReservationUnit) {
    const reservationUnitName = reservationUnit?.nameFi ?? "";

    return [reserveeName, reservationUnitName];
  }

  return [reserveeName, ""];
}

function constructEventTitle(
  res: ReservationType,
  resUnitPk: number,
  t: TFunction
) {
  const [reservee, unit] = getEventTitle({
    reservationUnitPk: resUnitPk,
    reservation: res,
    t,
  });
  if (unit.length > 0) {
    return `${reservee} (${unit})`;
  }
  return reservee;
}

// TODO this is a copy of the RequestedReservationCalendar
export function ReservationUnitCalendar({
  begin,
  reservationUnitPk,
  unitPk,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const { hasPermission } = useCheckPermission({
    units: [unitPk],
    permission: UserPermissionChoice.CanViewReservations,
  });

  const calendarEventExcludedLegends = [
    "RESERVATION_UNIT_RELEASED",
    "RESERVATION_UNIT_DRAFT",
  ];

  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${reservationUnitPk}`);
  const { data, loading: isLoading } = useReservationUnitCalendarQuery({
    fetchPolicy: "network-only",
    skip: reservationUnitPk === 0,
    variables: {
      id,
      pk: reservationUnitPk,
      state: RELATED_RESERVATION_STATES,
      beginDate: toApiDate(startOfISOWeek(new Date(begin))) ?? "",
      endDate: toApiDate(addDays(endOfISOWeek(new Date(begin)), 1)) ?? "",
    },
    onError: () => {
      errorToast({
        text: t("errors.errorFetchingData"),
      });
    },
  });

  function doesReservationAffectReservationUnit(
    reservation: ReservationType,
    resUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some((pk) => pk === resUnitPk);
  }

  const reservationSet = filterNonNullable(
    data?.reservationUnit?.reservationSet
  );
  const affectingReservations = filterNonNullable(data?.affectingReservations);
  const reservations = filterNonNullable(
    reservationSet?.concat(
      affectingReservations?.filter((y) =>
        doesReservationAffectReservationUnit(y, reservationUnitPk ?? 0)
      ) ?? []
    )
  );

  const events = reservations.map((reservation) => {
    const isBlocked = reservation.type === ReservationTypeChoice.Blocked;
    const title = !isBlocked
      ? constructEventTitle(reservation, reservationUnitPk, t)
      : t("MyUnits.Calendar.legend.closed");
    return {
      title,
      event: reservation,
      start: new Date(get(reservation, "begin")),
      end: new Date(get(reservation, "end")),
    };
  });

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
        isLoading={isLoading}
        onSelectEvent={(e) => {
          if (hasPermission) {
            window.open(getReservationUrl(e.event?.pk), "_blank");
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
}
