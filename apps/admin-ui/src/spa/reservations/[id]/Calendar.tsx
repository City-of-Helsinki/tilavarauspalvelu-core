import React, { useState } from "react";
import CommonCalendar, { CalendarEvent } from "common/src/calendar/Calendar";
import { Toolbar } from "common/src/calendar/Toolbar";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  type ReservationQuery,
  ReservationTypeChoice,
  UserPermissionChoice,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import { Legend, LegendsWrapper } from "@/component/Legend";
import { EditTimeModal } from "@/component/EditTimeModal";
import { isPossibleToEdit } from "./reservationModificationRules";
import { getEventBuffers } from "common/src/calendar/util";
import { filterNonNullable } from "common/src/helpers";
import VisibleIfPermission from "@/component/VisibleIfPermission";

// TODO fragment
type ReservationType = Omit<
  NonNullable<ReservationQuery["reservation"]>,
  "user"
>;

export type CalendarEventType = CalendarEvent<ReservationType>;
type Props = {
  reservation: ReservationType;
  refetch: (focusDate?: Date) => void;
  selected?: ReservationType;
  focusDate: Date;
  events: Array<CalendarEventType>;
};

const Container = styled.div`
  .rbc-calendar {
    display: grid;
  }
  .rbc-event-label {
    font-weight: 700;
  }
`;

type WeekOptions = "day" | "week" | "month";

/// @param reservation the current reservation to show in calendar
/// @param selected (for recurring only) different styling
/// @param focusDate date to show in the calendar
// TODO combine with the one in my-unit/ReservationUnitCalendar (without the time change button)
function Calendar({
  reservation,
  selected,
  refetch,
  focusDate,
  events: eventsAll,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  // Because the calendar is fixed to 6 - 24 interval anything outside it causes rendering artefacts.
  // TODO this is common problem in the UI
  // can be removed if and when scroll is added to the Calendar
  const isInsideCalendarRange = (x: { start: Date; end: Date }) =>
    x.start.getHours() >= 6 && x.end.getHours() >= 6;
  const events = eventsAll.filter(isInsideCalendarRange);

  const handleEditAccept = () => {
    refetch();
    setModalContent(null);
  };

  const handleEditTimeClick = () => {
    setModalContent(
      <EditTimeModal
        reservation={reservation}
        onAccept={handleEditAccept}
        onClose={() => setModalContent(null)}
      />
    );
  };

  const isAllowedToModify =
    !reservation.recurringReservation &&
    isPossibleToEdit(reservation.state, new Date(reservation.end));

  const eventBuffers = events
    ? getEventBuffers(
        filterNonNullable(
          events
            .map((e) => e.event)
            .filter((e) => e?.type !== ReservationTypeChoice.Blocked)
        )
      )
    : [];

  return (
    <Container>
      <CommonCalendar<ReservationType>
        events={[...events, ...eventBuffers]}
        toolbarComponent={(props) => (
          <Toolbar {...props}>
            {isAllowedToModify && (
              // NOTE don't use HDS buttons in the toolbar, breaks mobile layout
              <VisibleIfPermission
                reservation={reservation}
                permission={UserPermissionChoice.CanManageReservations}
              >
                <button type="button" onClick={handleEditTimeClick}>
                  {t("Reservation.EditTimeModal.acceptBtn")}
                </button>
              </VisibleIfPermission>
            )}
          </Toolbar>
        )}
        showToolbar
        begin={focusDate}
        eventStyleGetter={eventStyleGetter(reservation, selected)}
        onNavigate={(d: Date) => {
          refetch(d);
        }}
        viewType={calendarViewType}
        onView={(n: string) => {
          if (["day", "week", "month"].includes(n)) {
            setCalendarViewType(n as "day" | "week" | "month");
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
}

export default Calendar;
