import React, { useMemo } from "react";
import { startOfDay } from "date-fns";
import { useTranslation } from "next-i18next/pages";
import { useSearchParams } from "next/navigation";
import type { TFunction } from "next-i18next/pages";
import { getEventBuffers } from "@ui/components/calendar/utils";
import type { TimeSpanType } from "@ui/components/calendar/utils";
import { minutesOfDay, toWallClock } from "@ui/components/DatedWeekCalendar/engine";
import type { DatedEvent } from "@ui/components/DatedWeekCalendar/types";
import { ResourceDayCalendar } from "@ui/components/ResourceDayCalendar/ResourceDayCalendar";
import type { ResourceDayLabels, ResourceDayResource } from "@ui/components/ResourceDayCalendar/types";
import { ReservationTypeChoice, UserPermissionChoice } from "@gql/gql-types";
import type { ReservationUnitReservationsFragment } from "@gql/gql-types";
import { useSession } from "@/hooks";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { EVENT_BUFFER } from "@/modules/calendarStyling";
import { getReserveeName } from "@/modules/helpers";
import { hasPermission } from "@/modules/permissionHelper";
import { getReservationUrl } from "@/modules/urls";
import { eventStyleGetter } from "./eventStyleGetter";
import { ReservationTooltipContent } from "./ReservationTooltipContent";

const STEP_MINUTES = 30;

// The reservation is null for buffer time, which belongs to a reservation but is not one.
type UnitCalendarData = {
  reservation: ReservationUnitReservationsFragment | null;
  resourcePk: number;
};

type Resource = {
  title: string;
  pk: number;
  isDraft: boolean;
  events: Array<{ event?: ReservationUnitReservationsFragment | null }>;
  reservableTimeSpans: TimeSpanType[];
};

function getTitle(reservation: ReservationUnitReservationsFragment, t: TFunction): string {
  if (reservation.type === ReservationTypeChoice.Blocked) {
    return t("myUnits:Calendar.legend.closed");
  }
  return getReserveeName(reservation, t);
}

function toResource(resource: Resource, now: Date, t: TFunction): ResourceDayResource<UnitCalendarData> {
  const reservations = resource.events.flatMap(({ event }) => (event ? [event] : []));
  const events: Array<DatedEvent<UnitCalendarData>> = reservations.map((reservation) => ({
    id: reservation.id,
    title: getTitle(reservation, t),
    start: new Date(reservation.beginsAt),
    end: new Date(reservation.endsAt),
    data: { reservation, resourcePk: resource.pk },
  }));
  const buffers = getEventBuffers([...reservations]).map((buffer, index) => ({
    id: `buffer-${index}-${buffer.start.getTime()}`,
    title: "",
    start: buffer.start,
    end: buffer.end,
    data: { reservation: null, resourcePk: resource.pk },
  }));
  return {
    id: String(resource.pk),
    title: resource.title,
    isDraft: resource.isDraft,
    events: [...events, ...buffers],
    // Time that has passed can't be reserved, so only the part of a reservable time span after now is open.
    openRanges: resource.reservableTimeSpans
      .map((span) => ({
        start: new Date(Math.max(span.start.getTime(), now.getTime())),
        end: span.end,
      }))
      .filter((span) => span.end > span.start),
  };
}

function sortByDraftStatusAndTitle(resources: Resource[]): Resource[] {
  return [...resources].sort(
    (a, b) => Number(a.isDraft) - Number(b.isDraft) || a.title.toLowerCase().localeCompare(b.title.toLowerCase())
  );
}

interface UnitCalendarProps {
  date: Date;
  unitPk: number;
  resources: Resource[];
  canCreateReservations?: boolean;
  isLoading: boolean;
}

export function UnitCalendar({
  date,
  unitPk,
  resources,
  canCreateReservations = false,
  isLoading,
}: UnitCalendarProps): React.ReactElement {
  const { t } = useTranslation();
  const { user } = useSession();
  const searchParams = useSearchParams();
  const setParams = useSetSearchParams();

  const hasViewAccess = hasPermission(user, UserPermissionChoice.CanViewReservations, unitPk);
  const day = startOfDay(date);
  const rows = useMemo(
    () => sortByDraftStatusAndTitle(resources).map((resource) => toResource(resource, new Date(), t)),
    [resources, t]
  );

  const labels: ResourceDayLabels = {
    list: t("reservationCalendar:list"),
    skipToList: t("reservationCalendar:skipToList"),
    emptyList: t("reservationCalendar:emptyList"),
    free: t("reservationCalendar:free"),
    closed: t("reservationCalendar:closed"),
    opensInNewTab: t("reservationCalendar:opensInNewTab"),
    draftResource: t("reservationCalendar:draftResource"),
  };

  // A reservation on an overlapping unit also blocks this row. Screen readers are told whose it is.
  const getEventLabel = ({ title, data: { reservation, resourcePk } }: DatedEvent<UnitCalendarData>) => {
    if (reservation == null) {
      return t("reservationCalendar:buffer");
    }
    const label = `${t(`reservation:state.${reservation.state}`)}: ${title}`;
    const owner = reservation.reservationUnit;
    return owner?.pk !== resourcePk && owner?.nameFi ? `${label} (${owner.nameFi})` : label;
  };

  const getEventHref = ({ data: { reservation } }: DatedEvent<UnitCalendarData>) =>
    hasViewAccess && reservation != null ? getReservationUrl(reservation.pk, true) : undefined;

  const handleSelectSlot = (resourceId: string, range: { start: Date }): null => {
    const offset = minutesOfDay(toWallClock(range.start)) / STEP_MINUTES;
    const params = new URLSearchParams(searchParams);
    params.set("reservationUnit", resourceId);
    params.set("isModalOpen", "true");
    params.set("timeOffset", offset.toString());
    params.set("cellId", `${resourceId}-${offset}`);
    void setParams(params);
    return null;
  };

  return (
    <ResourceDayCalendar<UnitCalendarData>
      aria-label={t("reservation:calendar")}
      date={day}
      resources={rows}
      step={STEP_MINUTES}
      labels={labels}
      isLoading={isLoading}
      getEventLabel={getEventLabel}
      getEventHref={getEventHref}
      renderEventTooltip={({ data: { reservation } }) =>
        reservation != null ? <ReservationTooltipContent reservation={reservation} /> : null
      }
      getEventProps={({ data: { reservation, resourcePk }, title, start, end }) =>
        reservation == null
          ? { style: EVENT_BUFFER.style }
          : {
              style: eventStyleGetter(resourcePk)({
                title,
                start,
                end,
                event: reservation,
              }).style,
            }
      }
      onSelectSlot={canCreateReservations ? handleSelectSlot : undefined}
    />
  );
}
