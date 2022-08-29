import React from "react";
import styled from "styled-components";
import {
  addHours,
  endOfMonth,
  format,
  startOfWeek,
  getDay,
  startOfDay,
} from "date-fns";
import fi from "date-fns/locale/fi";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { useTranslation } from "react-i18next";
import { parseDate } from "../../modules/util";
import { ReservationType } from "../../modules/gql-types";
import { Reservation } from "../../modules/types";

// EventPropGetter<T> = (event: T, start: stringOrDate, end: stringOrDate, isSelected: boolean) => React.HTMLAttributes<HTMLDivElement>;
export type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  event: Reservation | ReservationType;
};

export type CalendarBufferEvent = {
  state: "BUFFER";
};

export type CalendarEventBuffer = {
  start: Date;
  end: Date;
  event: CalendarBufferEvent;
};

export type SlotProps = {
  className?: string;
  style?: React.CSSProperties;
};

type Props = {
  events: (CalendarEvent | CalendarEventBuffer)[];
  begin: Date;
  customEventStyleGetter?: ({ event }: CalendarEvent) => {
    style: React.CSSProperties;
  };
  slotPropGetter?: (date: Date) => SlotProps;
  viewType?: string;
  onNavigate?: (n: Date) => void;
  onView?: (n: string) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelecting?: ({ start, end }: CalendarEvent) => void;
  onEventDrop?: (event: CalendarEvent) => void;
  onEventResize?: (event: CalendarEvent) => void;
  onSelectSlot?: (
    {
      start,
      action,
    }: { start: Date; action: "select" | "click" | "doubleClick" },
    skipLengthCheck: boolean
  ) => void;
  draggableAccessor?: (event: CalendarEvent) => boolean;
  resizableAccessor?: (event: CalendarEvent) => boolean;
  toolbarComponent?: React.ReactNode;
  showToolbar?: boolean;
  reservable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  overflowBreakpoint?: string;
  step?: number;
  timeslots?: number;
};

export const eventStyleGetter = ({
  event,
}: CalendarEvent): { style: React.CSSProperties } => {
  const style = {
    borderRadius: "0px",
    opacity: "0.8",
    color: "var(--color-white)",
    display: "block",
  } as Record<string, string>;

  style.backgroundColor =
    event.state.toLowerCase() === "cancelled"
      ? "var(--color-error-dark)"
      : "var(--color-success-dark)";

  if (event.state.toLowerCase() === "cancelled") {
    style.textDecoration = "line-through";
  }

  return {
    style,
  };
};

const StyledCalendar = styled(BigCalendar)<{
  overflowBreakpoint: string;
  step: number;
  timeslots: number;
}>`
  ${({ timeslots }) => {
    switch (timeslots) {
      case 2:
      default:
        return ``;
      case 3:
        return `
          .rbc-time-gutter > .rbc-timeslot-group {
            .rbc-time-slot:not(:first-of-type) {
                border: none;
            }
          }

          .rbc-timeslot-group {
            min-height: 29px !important;
          }
        `;
    }
  }}

  .rbc-timeslot-group {
    z-index: 2;
    border-bottom: 0;
    min-height: ${({ step }) => {
      switch (step) {
        case 15:
          return "23px";
        case 30:
        default:
          return "40px";
      }
    }};
    border-top-color: var(--color-black-10);
  }

  .rbc-time-gutter {
    z-index: 4;
    position: sticky;
    left: 0;

    /* stylelint-disable */
    .rbc-timeslot-group,
    .rbc-time-slot {
      background-color: var(--color-white) !important;
      padding-bottom: 1px;
    }
    /* stylelint-enable */

    .rbc-timeslot-group {
      .rbc-time-slot {
        &:first-of-type {
          border-color: var(--color-black-20);
        }

        &:last-of-type {
          border: none;
        }

        border-top: 1px solid var(--color-black-10);
        flex: none;
      }
    }

    .rbc-label {
      padding: 0 var(--spacing-s) 0 var(--spacing-s);
      font-family: var(--font-regular);
      font-weight: 400;
      font-size: var(--fontsize-body-s);
    }
  }

  .rbc-time-header {
    .rbc-time-header-gutter {
      z-index: 5;
      position: sticky;
      left: 0;
      background-color: var(--color-white);
    }

    .rbc-timeslot-group {
      background-color: var(--color-white);
    }

    .rbc-header {
      font-family: var(--font-regular);
      font-weight: 400;
      font-size: var(--fontsize-body-m);
      text-transform: capitalize;
      border-bottom: 0;
      padding: var(--spacing-2-xs) 0;
      border-left-color: var(--color-black-40);
    }

    .rbc-allday-cell {
      display: none;
    }
  }

  .rbc-time-content {
    & > * + * > * {
      border-left-color: var(--color-black-40);
    }

    border-top: 1px solid var(--color-black-40);
  }

  &.view-week,
  &.view-day {
    &:after {
      content: "";
      display: block;
      box-shadow: 5px 0px 13px 0px rgb(0 0 0 / 15%);
      width: 69px;
      height: calc(100% - 90px);
      position: absolute;
      z-index: 20;
      bottom: 0px;
      left: 0px;
    }

    .rbc-day-slot {
      .rbc-events-container {
        margin: 0;
      }
      .rbc-timeslot-group {
        .rbc-time-slot.rbc-timeslot-inactive {
          border-top: none;
        }
        &:nth-of-type(2n) {
          .rbc-time-slot:last-of-type {
            border-bottom: 1px solid var(--color-black-10);
          }

          .rbc-time-slot.rbc-timeslot-inactive:last-of-type {
            border-bottom: 1px solid var(--color-black-20);
          }
        }
      }
    }
  }

  .rbc-time-view {
    overflow-x: scroll;

    @media (min-width: ${(props) => props.overflowBreakpoint}) {
      overflow-x: auto;
    }
  }

  &.view-day {
    .rbc-time-view {
      overflow-x: unset !important;
    }
  }

  &.view-week,
  &.view-month {
    .rbc-time-header,
    .rbc-time-content,
    .rbc-month-header,
    .rbc-month-row {
      min-width: 800px;
      overflow: visible;

      @media (min-width: ${(props) => props.overflowBreakpoint}) {
        min-width: unset;
      }
    }
  }

  position: relative;
  margin-bottom: var(--spacing-l);

  /* stylelint-disable */
  .rbc-time-view,
  .rbc-month-view {
    background-color: var(--color-white);
    border-color: var(--color-black-30);
    position: relative;
    width: 100%;
  }

  .rbc-month-view {
    .rbc-header {
      font-family: var(--font-regular);
      font-weight: 400;
      font-size: var(--fontsize-body-m);
      text-transform: capitalize;
      padding: var(--spacing-2-xs) 0;
    }

    .rbc-allday-cell {
      display: none;
    }

    .rbc-month-row {
      flex-basis: 100px;
    }
  }

  .rbc-timeslot-inactive {
    background-color: var(--color-black-10);
  }

  .rbc-event {
    &:hover {
      cursor: default;
    }

    &.rbc-event-movable {
      &:hover {
        cursor: move;
      }
    }

    width: 100% !important;
    left: 0 !important;
    z-index: 2 !important;
  }

  .rbc-event-buffer {
    color: var(--color-black-10) !important;
    border-top: none !important;
    border-bottom: none !important;
    border-color: var(--color-black-20) !important;
    border-right-color: var(--color-black-10) !important;
    border-left-color: var(--color-black-40) !important;
    z-index: 1 !important;
    opacity: 1 !important;
  }
`;

const StyledCalendarDND = styled(withDragAndDrop(StyledCalendar))``;

const locales = {
  fi,
};

const localizer = dateFnsLocalizer({
  format,
  parse: parseDate,
  startOfWeek,
  getDay,
  locales,
});

const Calendar = ({
  events,
  begin,
  customEventStyleGetter,
  slotPropGetter,
  viewType = "week",
  onSelecting,
  toolbarComponent,
  onNavigate = () => {},
  onView = () => {},
  onSelectEvent = () => {},
  onEventDrop = () => {},
  onEventResize = () => {},
  onSelectSlot = () => {},
  draggableAccessor = () => false,
  resizableAccessor = () => false,
  showToolbar = false,
  reservable = false,
  draggable = false,
  resizable = false,
  overflowBreakpoint = "850px",
  step = 30,
  timeslots = 2,
}: Props): JSX.Element => {
  const { i18n } = useTranslation();
  const Component = draggable ? StyledCalendarDND : StyledCalendar;

  return (
    <Component
      culture={i18n.language}
      formats={{
        dayFormat: "EEEEEE d.M.",
      }}
      eventPropGetter={customEventStyleGetter || eventStyleGetter}
      events={events}
      date={begin}
      onNavigate={onNavigate}
      view={viewType}
      onView={onView}
      min={addHours(startOfDay(begin), 6)}
      max={endOfMonth(begin)}
      localizer={localizer}
      toolbar={showToolbar}
      views={["day", "week", "month"]}
      className={`view-${viewType}`}
      components={{ toolbar: toolbarComponent }}
      onSelecting={onSelecting}
      onSelectSlot={onSelectSlot}
      selectable={reservable}
      onSelectEvent={onSelectEvent}
      onEventResize={onEventResize}
      slotPropGetter={slotPropGetter}
      onEventDrop={onEventDrop}
      resizable={resizable}
      draggableAccessor={draggableAccessor}
      resizableAccessor={resizableAccessor}
      overflowBreakpoint={overflowBreakpoint}
      step={step}
      timeslots={timeslots}
    />
  );
};

export default Calendar;
