import React, { useEffect, useMemo, useState } from "react";
import { gql } from "@apollo/client";
import { addDays, endOfISOWeek, startOfISOWeek } from "date-fns";
import { useTranslation } from "next-i18next/pages";
import type { TFunction } from "next-i18next/pages";
import { getEventBuffers } from "@ui/components/calendar/utils";
import { DatedWeekCalendar } from "@ui/components/DatedWeekCalendar/DatedWeekCalendar";
import type { DatedEvent, DatedOpenRange, DatedWeekView } from "@ui/components/DatedWeekCalendar/types";
import { errorToast } from "ui/src/components/toast";
import { RELATED_RESERVATION_STATES } from "ui/src/modules/const";
import { formatApiDate } from "ui/src/modules/date-utils";
import { createNodeId, filterNonNullable } from "ui/src/modules/helpers";
import { ReservationTypeChoice, useReservationUnitCalendarQuery, UserPermissionChoice } from "@gql/gql-types";
import type { ReservationUnitCalendarQuery } from "@gql/gql-types";
import { Legend, LegendsWrapper } from "@/components/Legend";
import { useSession } from "@/hooks";
import { useCalendarLabels } from "@/hooks/useCalendarLabels";
import { EVENT_BUFFER } from "@/modules/calendarStyling";
import { combineAffectingReservations, getReserveeName } from "@/modules/helpers";
import { hasPermission } from "@/modules/permissionHelper";
import { getReservationUrl } from "@/modules/urls";
import { eventStyleGetter, legend } from "./eventStyleGetter";

type Props = {
  begin: string;
  onNavigate: (date: Date) => void;
  reservationUnitPk: number;
  unitPk: number;
};

// The reservation is null for buffer time, which belongs to a reservation but is not one.
type UnitCalendarData = { reservation: ReservationType | null };

const CALENDAR_STEP_MINUTES = 30;

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

export function ReservationUnitCalendar({ begin, onNavigate, reservationUnitPk, unitPk }: Props): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<DatedWeekView>("week");
  const labels = useCalendarLabels(view);
  const { user } = useSession();

  const hasViewAccess = hasPermission(user, UserPermissionChoice.CanViewReservations, unitPk);

  const calendarEventExcludedLegends = new Set(["RESERVATION_UNIT_RELEASED", "RESERVATION_UNIT_DRAFT"]);

  const beginDate = new Date(begin);
  const {
    data,
    loading: isLoading,
    error,
  } = useReservationUnitCalendarQuery({
    fetchPolicy: "network-only",
    skip: reservationUnitPk === 0,
    variables: {
      id: createNodeId("ReservationUnitNode", reservationUnitPk),
      pk: reservationUnitPk,
      state: RELATED_RESERVATION_STATES,
      beginDate: formatApiDate(startOfISOWeek(beginDate)) ?? "",
      endDate: formatApiDate(addDays(endOfISOWeek(beginDate), 1)) ?? "",
    },
  });

  useEffect(() => {
    if (error == null) return;

    errorToast({
      text: t("errors:errorFetchingData"),
    });
  }, [error, t]);

  const reservations = combineAffectingReservations(data, reservationUnitPk);

  const events = useMemo(() => {
    const items: Array<DatedEvent<UnitCalendarData>> = reservations.map((reservation) => ({
      id: reservation.id,
      title:
        reservation.type === ReservationTypeChoice.Blocked
          ? t("myUnits:Calendar.legend.closed")
          : (constructEventTitle(reservation, reservationUnitPk, t) ?? ""),
      start: new Date(reservation.beginsAt),
      end: new Date(reservation.endsAt),
      data: { reservation },
    }));
    const buffers = getEventBuffers([...reservations]).map((buffer, index) => ({
      id: `buffer-${index}-${buffer.start.getTime()}`,
      title: "",
      start: buffer.start,
      end: buffer.end,
      data: { reservation: null },
    }));
    return [...items, ...buffers];
    // reservations is rebuilt from data on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reservationUnitPk, t]);

  // Time that has passed can't be reserved, so only the part of a reservable time span after now is open.
  const openRanges = useMemo((): DatedOpenRange[] | undefined => {
    if (data?.reservationUnit == null) {
      return undefined;
    }
    const now = new Date();
    return filterNonNullable(data.reservationUnit.reservableTimeSpans)
      .map((span) => ({
        start: new Date(Math.max(new Date(span.startDatetime).getTime(), now.getTime())),
        end: new Date(span.endDatetime),
      }))
      .filter((span) => span.end > span.start);
  }, [data]);

  const getEventLabel = ({ title, data: { reservation } }: DatedEvent<UnitCalendarData>) =>
    reservation == null ? t("reservationCalendar:buffer") : `${t(`reservation:state.${reservation.state}`)}: ${title}`;

  const getEventHref = ({ data: { reservation } }: DatedEvent<UnitCalendarData>) =>
    hasViewAccess && reservation != null ? getReservationUrl(reservation.pk, true) : undefined;

  return (
    <>
      <DatedWeekCalendar<UnitCalendarData>
        aria-label={t("reservation:calendar")}
        date={beginDate}
        onNavigate={onNavigate}
        view={view}
        onViewChange={setView}
        events={events}
        openRanges={openRanges}
        step={CALENDAR_STEP_MINUTES}
        locale={i18n.language}
        labels={labels}
        isLoading={isLoading}
        getEventLabel={getEventLabel}
        getEventHref={getEventHref}
        getEventProps={(item) =>
          item.data.reservation == null
            ? { style: EVENT_BUFFER.style }
            : {
                style: eventStyleGetter(reservationUnitPk)({
                  title: item.title,
                  start: item.start,
                  end: item.end,
                  event: item.data.reservation,
                }).style,
              }
        }
      />
      <LegendsWrapper>
        {legend
          .filter((l) => !calendarEventExcludedLegends.has(l.key))
          .map((l) => (
            <Legend key={l.label} style={l.style} label={t(l.label)} />
          ))}
      </LegendsWrapper>
    </>
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
