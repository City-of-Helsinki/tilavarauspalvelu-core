import { gql } from "@apollo/client";
import type { EventStyleType } from "@/modules/calendarStyling";
import {
  CALENDAR_EVENT_BASE_STYLE,
  CALENDAR_LEGENDS,
  CONFIRMED,
  EVENT_BUFFER,
  REST,
  STAFF_RESERVATION,
  WAITING_PAYMENT,
} from "@/modules/calendarStyling";
import type { CalendarEventType, EventType } from "@/modules/reservation";
import { ReservationStateChoice, ReservationTypeChoice } from "@gql/gql-types";
import type { EventStyleReservationFieldsFragment } from "@gql/gql-types";

const SELECTED = {
  style: {
    outline: "2px solid var(--color-bus)",
    outlineOffset: "3px",
  },
};

const selected_legends = new Set(["CONFIRMED", "WAITING_PAYMENT", "UNCONFIRMED", "STAFF_RESERVATION", "REST"]);
export const legend: EventStyleType[] = CALENDAR_LEGENDS.filter((x) => selected_legends.has(x.key));

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

// TODO: merge this with eventStyleGetter in admin-ui/src/lib/my-units/[id]/eventStyleGetter.ts
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

    const isBlocked = event?.type === ReservationTypeChoice.Blocked;
    const isStaff = event?.type === ReservationTypeChoice.Staff;
    // @ts-expect-error: we are dynamically overriding an enum upstream
    const isBuffer = event?.state === "BUFFER";

    const style = {
      ...CALENDAR_EVENT_BASE_STYLE,
      padding: "3px 6px",
      color: "var(--color-white)",
    };

    if (isConfirmed && isStaff) {
      Object.assign(style, STAFF_RESERVATION.style);
    } else if (isWaitingForPayment) {
      Object.assign(style, WAITING_PAYMENT.style);
    } else if (isConfirmed && !isBlocked) {
      Object.assign(style, CONFIRMED.style);
    } else if (isBuffer) {
      Object.assign(style, {
        ...EVENT_BUFFER.style,
        border: 0,
        // Invisible text, real solution is to fix big-calendar not to render it
        color: "var(--color-black-10)",
      });
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
