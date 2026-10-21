import React, { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type { Ref } from "react";
import { gql } from "@apollo/client";
import { add, startOfISOWeek } from "date-fns";
import { useTranslation } from "next-i18next/pages";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import type { CalendarEventBuffer } from "@ui/components/calendar/Calendar";
import { getEventBuffers } from "@ui/components/calendar/utils";
import { DatedWeekCalendar } from "@ui/components/DatedWeekCalendar/DatedWeekCalendar";
import type { DatedEvent, DatedWeekView } from "@ui/components/DatedWeekCalendar/types";
import { ToolbarBtn } from "ui/src/components/calendar/Toolbar";
import { filterNonNullable, toNumber } from "ui/src/modules/helpers";
import { ReservationStateChoice, ReservationTypeChoice, UserPermissionChoice } from "@gql/gql-types";
import type { TimeBlockSectionFragment } from "@gql/gql-types";
import { EditTimeModal } from "@/components/EditTimeModal";
import { Legend, LegendsWrapper } from "@/components/Legend";
import { ReservationSeriesView } from "@/components/ReservationSeriesView";
import { VisibleIfPermission } from "@/components/VisibleIfPermission";
import { useModal } from "@/context/ModalContext";
import { useReservationCalendarData, useReservationSeries } from "@/hooks";
import { useCalendarLabels } from "@/hooks/useCalendarLabels";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import type { CalendarEventType } from "@/modules/reservation";
import { isPossibleToEdit } from "@/modules/reservationModificationRules";
import { Accordion } from "@/styled";
import { eventStyleGetter, legend } from "./eventStyleGetter";

const Container = styled.div`
  display: grid;
  gap: var(--spacing-s);
`;

type CalendarProps = {
  reservation: TimeBlockSectionFragment;
  refetch: (focusDate?: Date) => void;
  focusDate: Date;
  events: CalendarEventType[];
};

type TimeBlockData = { calendarEvent: CalendarEventType | CalendarEventBuffer };

const CALENDAR_STEP_MINUTES = 30;

const isBuffer = (item: CalendarEventType | CalendarEventBuffer) => item.event?.state === "BUFFER";

const reservationPkOf = (item: CalendarEventType | CalendarEventBuffer) =>
  item.event != null && "pk" in item.event ? item.event.pk : undefined;

function toDatedEvent(item: CalendarEventType | CalendarEventBuffer, index: number): DatedEvent<TimeBlockData> {
  const title = "title" in item && item.title ? item.title : "";
  return {
    id: `${isBuffer(item) ? "buffer" : "reservation"}-${reservationPkOf(item) ?? index}-${item.start.getTime()}`,
    title,
    start: item.start,
    end: item.end,
    data: { calendarEvent: item },
  };
}

/// @param reservation the current reservation to show in calendar
/// @param selected (for recurring only) different styling
/// @param focusDate date to show in the calendar
const Calendar = forwardRef(function Calendar(
  { reservation, refetch, focusDate, events }: CalendarProps,
  ref: Ref<HTMLDivElement>
): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { setModalContent } = useModal();
  const [view, setView] = useState<DatedWeekView>("week");
  const labels = useCalendarLabels(view);

  const searchParams = useSearchParams();
  const selected = toNumber(searchParams.get("selected"));
  const selectedEvent = events.find((e) => e.event?.pk === selected);

  const handleEditAccept = () => {
    refetch();
    setModalContent(null);
  };

  const handleEditTimeClick = () => {
    setModalContent(
      <EditTimeModal reservation={reservation} onAccept={handleEditAccept} onClose={() => setModalContent(null)} />
    );
  };

  const isAllowedToModify =
    !reservation.reservationSeries && isPossibleToEdit(reservation.state, new Date(reservation.endsAt));

  const eventBuffers = getEventBuffers(
    filterNonNullable(events.map((e) => e.event).filter((e) => e?.type !== ReservationTypeChoice.Blocked))
  );
  const datedEvents = useMemo(
    () => [...events, ...eventBuffers].map((item, index) => toDatedEvent(item, index)),
    // eventBuffers is derived from events
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events]
  );

  const getStyle = eventStyleGetter(reservation, selectedEvent?.event);

  const getEventLabel = ({ data, title }: DatedEvent<TimeBlockData>) => {
    const { calendarEvent } = data;
    if (isBuffer(calendarEvent)) {
      return t("reservationCalendar:buffer");
    }
    const state = calendarEvent.event?.state ? t(`reservation:state.${calendarEvent.event.state}`) : "";
    const isSelected = selected != null && reservationPkOf(calendarEvent) === selected;
    return [state ? `${state}: ${title}` : title, isSelected ? t("reservationCalendar:selected") : null]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <Container ref={ref}>
      <DatedWeekCalendar<TimeBlockData>
        aria-label={t("reservation:calendar")}
        date={focusDate}
        onNavigate={(d) => refetch(d)}
        view={view}
        onViewChange={setView}
        events={datedEvents}
        step={CALENDAR_STEP_MINUTES}
        locale={i18n.language}
        labels={labels}
        getEventLabel={getEventLabel}
        getEventProps={(item) => ({ style: getStyle(item.data.calendarEvent as CalendarEventType).style })}
        toolbarExtra={
          isAllowedToModify ? (
            // NOTE don't use HDS buttons in the toolbar, breaks mobile layout
            <VisibleIfPermission reservation={reservation} permission={UserPermissionChoice.CanManageReservations}>
              <ToolbarBtn onClick={handleEditTimeClick}>{t("reservation:EditTimeModal.acceptBtn")}</ToolbarBtn>
            </VisibleIfPermission>
          ) : null
        }
      />
      <LegendsWrapper>
        {legend.map((l) => (
          <Legend key={l.label} style={l.style} label={t(l.label)} />
        ))}
      </LegendsWrapper>
    </Container>
  );
});

const maybeStringToDate: (s?: string) => Date | undefined = (str) => (str ? new Date(str) : undefined);

const onlyFutureDates: (d?: Date) => Date | undefined = (d) => (d && d > new Date() ? d : undefined);

export function TimeBlockSection({
  reservation,
  onReservationUpdated,
}: Readonly<{
  reservation: TimeBlockSectionFragment;
  onReservationUpdated: () => Promise<unknown>;
}>): React.ReactElement {
  const { t } = useTranslation();

  // date focus rules for Calendar
  // (1) if selected => show that
  // (2) else if reservation is in the future => show that
  // (3) else if reservation.recurrence has an event in the future => show that
  // (4) else show today
  const { reservations } = useReservationSeries(reservation.reservationSeries?.pk ?? undefined);

  const nextReservation = reservations.find(
    (x) => x.state === ReservationStateChoice.Confirmed && new Date(x.beginsAt) > new Date()
  );

  const shownReservation = new Date(reservation.beginsAt) > new Date() ? reservation : nextReservation;

  const [focusDate, setFocusDate] = useState<Date>(
    onlyFutureDates(maybeStringToDate(shownReservation?.beginsAt)) ?? new Date()
  );

  const calendarRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const setSearchParams = useSetSearchParams();

  const setSelected: (pk: number) => Promise<void> = async (pk) => {
    const params = new URLSearchParams(searchParams);
    if (pk > 0) {
      params.set("selected", pk.toString());
      await setSearchParams(params);
      const selectedReservation = reservations.find((x) => x.pk === pk);
      if (selectedReservation) {
        setFocusDate(new Date(selectedReservation.beginsAt));
        calendarRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      params.delete("selected");
      await setSearchParams(params);
    }
  };

  // No month view so always query the whole week even if a single day is selected
  // to avoid spamming queries and having to deal with start of day - end of day.
  // focus day can be in the middle of the week.
  const { events: eventsAll, refetch: calendarRefetch } = useReservationCalendarData({
    begin: startOfISOWeek(focusDate),
    end: add(startOfISOWeek(focusDate), { days: 7 }),
    reservationUnitPk: reservation.reservationUnit.pk,
    reservationPk: reservation.pk,
  });

  // Necessary because the reservation can be removed (denied) from the parent component
  // so update the calendar when that happens.
  useEffect(() => {
    if (reservation != null) {
      void calendarRefetch();
    }
  }, [reservation, calendarRefetch]);

  const handleChanged = async (): Promise<unknown> => {
    await calendarRefetch();
    return onReservationUpdated();
  };

  return (
    <>
      {reservation.reservationSeries?.pk && (
        <Accordion id="reservation__recurring" heading={t("reservation:recurring")}>
          <ReservationSeriesView
            reservationSeriesPk={reservation.reservationSeries.pk}
            onSelect={setSelected}
            onReservationUpdated={handleChanged}
            onChange={handleChanged}
            reservationToCopy={reservation}
          />
        </Accordion>
      )}

      <Accordion
        heading={t("reservation:calendar")}
        initiallyOpen={reservation.reservationSeries != null}
        id="reservation__calendar"
      >
        <Calendar
          ref={calendarRef}
          reservation={reservation}
          focusDate={focusDate}
          refetch={async (d) => {
            await onReservationUpdated();
            // NOTE setting focus date refetches calendar data, don't double refetch
            if (!d || focusDate === d) {
              await calendarRefetch();
            } else {
              setFocusDate(d);
            }
          }}
          events={eventsAll}
        />
      </Accordion>
    </>
  );
}

export const TIME_BLOCK_FRAGMENT = gql`
  fragment TimeBlockSection on ReservationNode {
    id
    pk
    ...EventStyleReservationFields
    ...ReservationToCopy
    ...VisibleIfPermissionFields
    reservationUnit {
      id
      pk
    }
    reservationSeries {
      id
      pk
    }
  }
`;
