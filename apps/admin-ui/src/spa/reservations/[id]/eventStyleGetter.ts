import type { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationStateChoice,
  ReservationTypeChoice,
  type ReservationPageQuery,
} from "@gql/gql-types";
import {
  COMMON_LEGEND,
  CONFIRMED,
  EVENT_STYLE,
  STAFF_RESERVATION,
  WAITING_PAYMENT,
  POST_PAUSE,
} from "@/common/calendarStyling";

const SELECTED = {
  style: {
    outline: "2px solid var(--color-bus)",
    outlineOffset: "3px",
  },
};

const REST = {
  style: {
    background: `var(--tilavaraus-event-rest-background)`,
    color: `black`,
    borderColor: `var(--tilavaraus-event-rest-border-color)`,
    borderStyle: "solid",
    borderWidth: "0px 0px 0px 3px",
  },
};

export const legend = [
  ...COMMON_LEGEND,
  {
    label: "Calendar.legend.rest",
    style: REST.style,
  },
];

// TODO fragment
export type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;
export type EventBufferType = Pick<
  ReservationType,
  "begin" | "end" | "bufferTimeAfter" | "bufferTimeBefore"
>;
export type EventType = EventBufferType &
  Pick<
    ReservationType,
    "pk" | "type" | "state" | "name" | "recurringReservation"
  >;
export type CalendarEventType = CalendarEvent<EventType>;

// TODO combine with the eventStyleGetter in my-units/eventStyleGetter.ts
const eventStyleGetter =
  (
    currentReservation: ReservationType | undefined,
    selectedReservation: EventType | undefined
  ) =>
  ({
    event,
  }: CalendarEventType): {
    style: React.CSSProperties;
    className?: string;
  } => {
    const isPartOfRecurrance =
      currentReservation?.recurringReservation?.pk != null &&
      currentReservation?.recurringReservation.pk ===
        event?.recurringReservation?.pk;

    const isConfirmed = event?.state === ReservationStateChoice.Confirmed;
    const isWaitingForPayment =
      event?.state === ReservationStateChoice.WaitingForPayment;

    const isClosed = event?.type === ReservationTypeChoice.Blocked;
    const isStaff = event?.type === ReservationTypeChoice.Staff;
    // @ts-expect-error: TODO: we are dynamically overriding an enum upstream
    const isBuffer = event?.state === "BUFFER";

    const style = {
      ...EVENT_STYLE,
      padding: "3px 6px",
      color: "var(--color-white)",
    };

    if (isConfirmed && isStaff) {
      Object.assign(style, STAFF_RESERVATION.style);
    } else if (isWaitingForPayment) {
      Object.assign(style, WAITING_PAYMENT.style);
    } else if (isConfirmed && !isClosed) {
      Object.assign(style, CONFIRMED.style);
    } else if (isBuffer) {
      Object.assign(style, { ...POST_PAUSE.style, border: 0 });
    } else {
      Object.assign(style, REST.style);
    }

    if (currentReservation?.pk === event?.pk || isPartOfRecurrance) {
      style.cursor = "default";
    }

    if (selectedReservation?.pk === event?.pk) {
      return {
        style: {
          ...style,
          ...SELECTED.style,
        },
      };
    }

    return {
      style,
    };
  };

export { eventStyleGetter };
