import React, { useState } from "react";
import CommonCalendar from "common/src/calendar/Calendar";
import { Toolbar } from "common/src/calendar/Toolbar";
import { add, startOfISOWeek } from "date-fns";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { type ReservationType } from "common/types/gql-types";
import eventStyleGetter, { legend } from "./eventStyleGetter";
import Legend from "./Legend";
import { useReservationData } from "./hooks";

type Props = {
  begin: string;
  reservationUnitPk: string;
  reservation: ReservationType;
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

type WeekOptions = "day" | "week" | "month";

const viewToDays = (view: string) => {
  if (view === "day") {
    return 1;
  }
  if (view === "month") {
    return 31;
  }
  if (view === "week") {
    return 7;
  }
  return 7;
};

const Calendar = ({
  begin,
  reservationUnitPk,
  reservation,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const [focusDate, setFocusDate] = useState(startOfISOWeek(new Date(begin)));
  const [calendarViewType, setCalendarViewType] = useState<WeekOptions>("week");

  const { events } = useReservationData(
    focusDate,
    add(focusDate, { days: viewToDays(calendarViewType) }),
    reservationUnitPk,
    reservation.pk ?? undefined
  );

  // TODO today button in the reservation calendar? should it instead be this reservation?
  // TODO check that the reservation / series is displayed properly (based on UI spect)
  //  currently seems that it's using default display rules
  return (
    <Container>
      <CommonCalendar
        events={events}
        toolbarComponent={Toolbar}
        showToolbar
        begin={focusDate}
        eventStyleGetter={eventStyleGetter(reservation)}
        /* TODO if we want to onSelect use router or use a Popup / Modal to show it
        onSelectEvent={(e) => {}}}
        */
        onNavigate={(d: Date) => {
          setFocusDate(d);
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
