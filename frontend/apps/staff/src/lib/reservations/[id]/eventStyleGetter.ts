import { gql } from "@apollo/client";
import {
  COMMON_LEGEND,
  CONFIRMED,
  EVENT_STYLE,
  STAFF_RESERVATION,
  WAITING_PAYMENT,
  POST_PAUSE,
} from "@/modules/calendarStyling";
import { type CalendarEventType, type EventType } from "@/modules/reservation";
import {
  type EventStyleReservationFieldsFragment,
  ReservationStateChoice,
  ReservationTypeChoice,
} from "@gql/gql-types";

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
    label: "myUnits:Calendar.legend.reserved",
    style: REST.style,
  },
];

export const EVENT_STYLE_RESERVATION_FRAGMENT = gql`
  fragment EventStyleReservationFields on ReservationNode {
    id
    pk
    beginsAt
    endsAt
    bufferTimeAfter
    bufferTimeBefore
    name
    state
    type
    reservationSeries {
      id
      pk
    }
  }
`;

type CurrentReservationType = Pick<EventStyleReservationFieldsFragment, "pk" | "reservationSeries">;

// TODO combine with the eventStyleGetter in my-units/eventStyleGetter.ts
const eventStyleGetter =
  (currentReservation: CurrentReservationType, selectedReservation: EventType | undefined) =>
  ({
    event,
  }: CalendarEventType): {
    style: React.CSSProperties;
    className?: string;
  } => {
    const isPartOfRecurrence =
      currentReservation?.reservationSeries?.pk != null &&
      currentReservation?.reservationSeries.pk === event?.reservationSeries?.pk;

    const isConfirmed = event?.state === ReservationStateChoice.Confirmed;
    const isWaitingForPayment = event?.state === ReservationStateChoice.WaitingForPayment;

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

    if (currentReservation?.pk === event?.pk || isPartOfRecurrence) {
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
