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
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  ToolbarProps,
} from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { parseDate } from "../common/util";

export type CalendarEvent<T> = {
  title?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  event?: T;
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

type Props<T> = {
  events: (CalendarEvent<T> | CalendarEventBuffer)[];
  begin: Date;
  eventStyleGetter: ({ event }: CalendarEvent<T>) => {
    style: React.CSSProperties;
  };
  slotPropGetter?: (date: Date) => SlotProps;
  viewType?: string;
  onNavigate?: (n: Date) => void;
  onView?: (n: string) => void;
  onSelectEvent?: (event: CalendarEvent<T>) => void;
  onSelecting?: ({ start, end }: CalendarEvent<T>) => void;
  onEventDrop?: (event: CalendarEvent<T>) => void;
  onEventResize?: (event: CalendarEvent<T>) => void;
  onSelectSlot?: (
    {
      start,
      action,
    }: { start: Date; action: "select" | "click" | "doubleClick" },
    skipLengthCheck: boolean
  ) => void;
  min?: Date;
  max?: Date;
  draggableAccessor?: (event: CalendarEvent<T>) => boolean;
  resizableAccessor?: (event: CalendarEvent<T>) => boolean;
  toolbarComponent?: (props: ToolbarProps) => JSX.Element | React.ReactNode;
  eventWrapperComponent?: (props: unknown) => JSX.Element | React.ReactNode;
  dateCellWrapperComponent?: (props: unknown) => JSX.Element | React.ReactNode;
  showToolbar?: boolean;
  reservable?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  overflowBreakpoint?: string;
  step?: number;
  timeslots?: number;
  culture?: string;
  longPressThreshold?: number;
};

const StyledCalendar = styled(BigCalendar)<{
  overflowBreakpoint: string;
  step: number;
  timeslots: number;
  $isDraggable: boolean;
}>`
  ${({ timeslots }) => {
    switch (timeslots) {
      case 2:
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
      default:
        return ``;
    }
  }}

  .rbc-current-time-indicator {
    border-top: 4px dotted #551a8b;
    background-color: transparent;
  }

  .rbc-timeslot-group {
    border-bottom: 0;
    &:nth-child(1n) {
      border-bottom: 1px solid var(--color-black-20);
    }

    z-index: 2;
    min-height: ${({ step }) => {
      switch (step) {
        case 15:
          return "23px";
        case 30:
        default:
          return "40px";
      }
    }};
    border-top-color: var(--color-black-20);
  }

  .rbc-time-gutter {
    z-index: 100;
    position: sticky;
    left: 0;
    margin-top: -1px;

    .rbc-label {
      padding: 0 var(--spacing-s) 0 var(--spacing-s);
      font-family: var(--font-regular);
      font-weight: 400;
      font-size: var(--fontsize-body-s);
    }

    /* stylelint-disable */
    .rbc-timeslot-group,
    .rbc-time-slot {
      background-color: var(--color-white) !important;
      padding-bottom: 1px;

      .rbc-label {
        position: relative;
        top: var(--spacing-xs);
      }
    }
    /* stylelint-enable */

    .rbc-timeslot-group {
      .rbc-time-slot {
        border-top: 1px solid var(--color-black-20);
        border-left: none;
        flex: none;

        &:first-of-type {
          border-color: var(--color-black-20);
        }

        &:last-of-type {
          border: none;
        }
      }

      &:first-of-type {
        .rbc-time-slot {
          border-top: 0;
        }
      }

      border: 0;
    }
  }

  .rbc-time-header {
    .rbc-today {
      background-color: transparent;
    }

    .rbc-time-header-content {
      border: 0;
    }

    .rbc-time-header-gutter {
      z-index: 5;
      position: sticky;
      left: 0;
      background-color: var(--color-white);
    }

    /* stylelint-disable-next-line */
    .rbc-timeslot-group {
      background-color: var(--color-white);
    }

    .rbc-header {
      font-family: var(--font-regular);
      font-weight: 400;
      font-size: var(--fontsize-body-s);
      text-transform: capitalize;
      border-bottom: 0;
      padding: var(--spacing-2-xs) 0;
      border: 0;
    }

    .rbc-allday-cell {
      display: none;
    }
  }

  .rbc-time-content {
    & > * + * > * {
      border-left-color: var(--color-black-20);
    }

    border-top: 1px solid var(--color-black-20);
  }

  &.view-week,
  &.view-day {
    .rbc-time-column {
      padding-top: 1px;
    }

    .rbc-day-slot {
      &.rbc-today {
        background-color: #f6f3f9;
      }

      /* stylelint-disable-next-line */
      .rbc-time-slot {
        border-top: none;
      }

      .rbc-events-container {
        margin: 0;

        .rbc-event-buffer {
          &:first-of-type {
            &:before {
              border-top: 4px double var(--color-black-40);
              content: "";
              position: absolute;
              width: calc(100% + 4px);
              top: 0px;
              left: -4px;
            }
          }

          &:last-of-type {
            &:before {
              border-bottom: 4px double var(--color-black-40);
              content: "";
              position: absolute;
              width: calc(100% + 4px);
              bottom: 0;
              left: -4px;
            }
          }
        }
      }

      .rbc-timeslot-group {
        .rbc-time-slot.rbc-timeslot-inactive {
          border-top: none;
        }
      }
    }
  }

  .rbc-time-view {
    overflow-x: scroll;
    overflow-y: hidden;

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
      min-width: 550px;
      overflow: visible;

      @media (min-width: ${(props) => props.overflowBreakpoint}) {
        min-width: unset;
      }
    }

    .rbc-show-more {
      display: none;
    }
  }

  position: relative;

  /* stylelint-disable */
  .rbc-time-view,
  .rbc-month-view {
    background-color: var(--color-white);
    border: 0;
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
    background-color: var(--color-black-5);
    border-left: 2px solid var(--color-black-30);
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
    padding-top: 2px;
  }

  .rbc-event-buffer {
    color: var(--color-black-5) !important;
    border-top: none !important;
    border-bottom: none !important;
    border-color: var(--color-black-20) !important;
    border-right-color: var(--color-black-10) !important;
    border-left-color: var(--color-black-20) !important;
    z-index: 1 !important;
    opacity: 1 !important;
  }

  .rbc-event-movable {
    overflow: visible !important;

    .rbc-addons-dnd-resize-ns-anchor {
      ${({ $isDraggable }) => $isDraggable === false && "display: none;"}

      &:first-child {
        top: -10px;
      }

      &:last-child {
        bottom: 3px;
      }

      .rbc-addons-dnd-resize-ns-icon {
        &:after {
          content: "";
          position: absolute;
          border: 2px solid var(--color-bus);
          border-radius: 50%;
          width: 12px;
          height: 12px;
          left: 43%;
          background-color: var(--tilavaraus-event-initial-color);
        }

        border: 0 !important;
      }
    }
  }

  .rbc-slot-selection {
    display: none;
  }

  .rbc-event-label {
    text-overflow: unset;
    white-space: normal;
  }

  .isSmall .rbc-event-label {
    white-space: nowrap;
  }
`;

const StyledCalendarDND = styled(withDragAndDrop(StyledCalendar))``;

const locales = {
  fi,
};

const localizer = dateFnsLocalizer({
  format: (date: Date, originalFormat: string) => {
    let fmt = "";
    switch (originalFormat) {
      case "h:mma":
        fmt = "H:mm";
        break;
      default:
        fmt = originalFormat;
    }
    return format(date, fmt, { locale: locales.fi });
  },
  parse: parseDate,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const Calendar = <T extends Record<string, unknown>>({
  events,
  begin,
  eventStyleGetter,
  slotPropGetter,
  viewType = "week",
  onSelecting,
  toolbarComponent,
  eventWrapperComponent,
  dateCellWrapperComponent,
  onNavigate = () => {},
  onView = () => {},
  min,
  max,
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
  culture = "fi",
  longPressThreshold = 250,
}: Props<T>): JSX.Element => {
  const Component: React.ElementType = draggable
    ? StyledCalendarDND
    : StyledCalendar;

  return (
    <Component
      culture={culture}
      formats={{
        dayFormat: "EEEEEE d.M.",
        timeGutterFormat: "H",
        eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
          `${format(start, "H:mm")}-${format(end, "H:mm")}`,
      }}
      eventPropGetter={eventStyleGetter}
      events={events}
      date={begin}
      onNavigate={onNavigate}
      view={viewType}
      onView={onView}
      min={min || addHours(startOfDay(begin), 6)}
      max={max || endOfMonth(begin)}
      localizer={localizer}
      toolbar={showToolbar}
      views={["day", "week", "month"]}
      className={`view-${viewType}`}
      components={{
        toolbar: toolbarComponent,
        eventWrapper: eventWrapperComponent,
        dateCellWrapper: dateCellWrapperComponent,
      }}
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
      longPressThreshold={longPressThreshold}
      showMultiDayTimes
      $isDraggable={draggable}
    />
  );
};

export default Calendar;
