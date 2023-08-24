import React, { useState } from "react";
import CommonCalendar from "common/src/calendar/Calendar";
import { Toolbar } from "common/src/calendar/Toolbar";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { type ReservationType } from "common/types/gql-types";
import { useModal } from "app/context/ModalContext";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import Legend from "./Legend";
import EditTimeModal from "../EditTimeModal";
import { isPossibleToEdit } from "./reservationModificationRules";

type Props = {
  reservation: ReservationType;
  refetch?: (focusDate?: Date) => void;
  selected?: ReservationType;
  focusDate: Date;
  events: Array<{
    event: ReservationType;
    title?: string;
    start: Date;
    end: Date;
  }>;
};

const Legends = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  padding: var(--spacing-m) 0;
`;

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
const Calendar = ({
  reservation,
  selected,
  refetch,
  focusDate,
  events: eventsAll,
}: Props): JSX.Element => {
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
    if (refetch) {
      refetch();
    }
    setModalContent(null);
  };

  const handleEditTimeClick = () => {
    setModalContent(
      <EditTimeModal
        reservation={reservation}
        onAccept={handleEditAccept}
        onClose={() => setModalContent(null)}
      />,
      true
    );
  };

  const isAllowedToModify =
    !reservation.recurringReservation &&
    isPossibleToEdit(reservation.state, new Date(reservation.end));

  return (
    <Container>
      <CommonCalendar<ReservationType>
        events={events}
        toolbarComponent={(props) => (
          <Toolbar {...props}>
            {isAllowedToModify && (
              // NOTE don't use HDS buttons in the toolbar, breaks mobile layout
              <button type="button" onClick={handleEditTimeClick}>
                {t("Reservation.EditTime.buttonName")}
              </button>
            )}
          </Toolbar>
        )}
        showToolbar
        begin={focusDate}
        eventStyleGetter={eventStyleGetter(reservation, selected)}
        onNavigate={(d: Date) => {
          if (refetch) {
            refetch(d);
          }
        }}
        viewType={calendarViewType}
        onView={(n: string) => {
          if (["day", "week", "month"].includes(n)) {
            setCalendarViewType(n as "day" | "week" | "month");
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
