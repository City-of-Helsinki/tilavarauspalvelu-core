import React, { forwardRef, type Ref, useEffect, useRef, useState } from "react";
import { gql } from "@apollo/client";
import { add, startOfISOWeek } from "date-fns";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import CommonCalendar from "ui/src/components/calendar/Calendar";
import { Toolbar, ToolbarBtn } from "ui/src/components/calendar/Toolbar";
import { filterNonNullable, toNumber } from "ui/src/modules/helpers";
import { getEventBuffers } from "@ui/components/calendar/utils";
import { EditTimeModal } from "@/components/EditTimeModal";
import { Legend, LegendsWrapper } from "@/components/Legend";
import { ReservationSeriesView } from "@/components/ReservationSeriesView";
import VisibleIfPermission from "@/components/VisibleIfPermission";
import { useModal } from "@/context/ModalContext";
import { useReservationCalendarData, useReservationSeries } from "@/hooks";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import type { CalendarEventType, EventType } from "@/modules/reservation";
import { isPossibleToEdit } from "@/modules/reservationModificationRules";
import { Accordion } from "@/styled";
import {
  ReservationStateChoice,
  ReservationTypeChoice,
  type TimeBlockSectionFragment,
  UserPermissionChoice,
} from "@gql/gql-types";
import { eventStyleGetter, legend } from "./eventStyleGetter";

const Container = styled.div`
  .rbc-calendar {
    display: grid;
  }

  .rbc-event-label {
    font-weight: 700;
  }
`;

type WeekOptions = "day" | "week" | "month";

type CalendarProps = {
  reservation: TimeBlockSectionFragment;
  refetch: (focusDate?: Date) => void;
  focusDate: Date;
  events: Array<CalendarEventType>;
};

/// @param reservation the current reservation to show in calendar
/// @param selected (for recurring only) different styling
/// @param focusDate date to show in the calendar
// TODO combine with the one in my-unit/ReservationUnitCalendar (without the time change button)
const Calendar = forwardRef(function Calendar(
  { reservation, refetch, focusDate, events: eventsAll }: CalendarProps,
  ref: Ref<HTMLDivElement>
): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const searchParams = useSearchParams();
  const selected = toNumber(searchParams.get("selected"));
  const selectedEvent = eventsAll.find((e) => e.event?.pk === selected);

  // Because the calendar is fixed to 6 - 24 interval anything outside it causes rendering artefacts.
  const isInsideCalendarRange = (x: { start: Date; end: Date }) => x.end.getHours() > 6;
  const events = eventsAll.filter(isInsideCalendarRange);

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

  return (
    <Container ref={ref}>
      <CommonCalendar<EventType>
        events={[...events, ...eventBuffers]}
        toolbarComponent={(props) => (
          <Toolbar {...props}>
            {isAllowedToModify && (
              // NOTE don't use HDS buttons in the toolbar, breaks mobile layout
              <VisibleIfPermission reservation={reservation} permission={UserPermissionChoice.CanManageReservations}>
                <ToolbarBtn onClick={handleEditTimeClick}>{t("reservation:EditTimeModal.acceptBtn")}</ToolbarBtn>
              </VisibleIfPermission>
            )}
          </Toolbar>
        )}
        showToolbar
        begin={focusDate}
        eventStyleGetter={eventStyleGetter(reservation, selectedEvent?.event)}
        onNavigate={(d: Date) => {
          refetch(d);
        }}
        viewType={calendarViewType}
        onView={(n) => {
          if (n === "day" || n === "week" || n === "month") {
            setCalendarViewType(n);
          }
        }}
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
}>): JSX.Element {
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

  const setSelected = (pk: number) => {
    const params = new URLSearchParams(searchParams);
    if (pk > 0) {
      params.set("selected", pk.toString());
      setSearchParams(params);
      const selectedReservation = reservations.find((x) => x.pk === pk);
      if (selectedReservation) {
        setFocusDate(new Date(selectedReservation.beginsAt));
        calendarRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      params.delete("selected");
      setSearchParams(params);
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
      calendarRefetch();
    }
  }, [reservation, calendarRefetch]);

  const handleChanged = async (): Promise<unknown> => {
    // TODO use allSettled
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
          refetch={(d) => {
            onReservationUpdated();
            // NOTE setting focus date refetches calendar data, don't double refetch
            if (!d || focusDate === d) {
              calendarRefetch();
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
