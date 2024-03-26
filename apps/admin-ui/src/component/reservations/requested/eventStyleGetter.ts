import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  State,
  type ReservationNode,
  ReservationTypeChoice,
} from "common/types/gql-types";
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

// TODO combine with the eventStyleGetter in my-units/eventStyleGetter.ts
const eventStyleGetter =
  (
    currentReservation?: ReservationNode,
    selectedReservation?: ReservationNode
  ) =>
  ({
    event,
  }: CalendarEvent<ReservationNode>): {
    style: React.CSSProperties;
    className?: string;
  } => {
    const isPartOfRecurrance =
      currentReservation?.recurringReservation &&
      currentReservation.recurringReservation?.pk ===
        event?.recurringReservation?.pk;

    const isConfirmed = event?.state === State.Confirmed;
    const isWaitingForPayment = event?.state === State.WaitingForPayment;

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

export default eventStyleGetter;
