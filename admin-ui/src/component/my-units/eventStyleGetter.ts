import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationsReservationStateChoices,
  ReservationType,
} from "common/types/gql-types";
import {
  CLOSED,
  COMMON_LEGEND,
  CONFIRMED,
  EVENT_STYLE,
  INTERSECTING_RESERVATION_UNIT,
  POST_PAUSE,
  RESERVATION_UNIT_DRAFT,
  RESERVATION_UNIT_RELEASED,
  STAFF_RESERVATION,
  UNCONFIRMED,
  WAITING_PAYMENT,
} from "../../common/calendarStyling";

type EventKey =
  | "CONFIRMED"
  | "UNCONFIRMED"
  | "STAFF_RESERVATION"
  | "INTERSECTING_RESERVATION_UNIT"
  | "PAUSE"
  | "CLOSED"
  | "WAITING_PAYMENT"
  | "RESERVATION_UNIT_RELEASED"
  | "RESERVATION_UNIT_DRAFT";

type EventStyle = {
  key: EventKey;
  label: string;
  style: Record<string, string>;
};

export const legend: EventStyle[] = [
  ...COMMON_LEGEND,
  {
    key: "INTERSECTING_RESERVATION_UNIT",
    label: "MyUnits.Calendar.legend.intersecting",
    style: INTERSECTING_RESERVATION_UNIT.style,
  },
  {
    key: "PAUSE",
    label: "MyUnits.Calendar.legend.pause",
    style: POST_PAUSE.style,
  },
  {
    key: "CLOSED",
    label: "MyUnits.Calendar.legend.closed",
    style: CLOSED.style,
  },
  {
    key: "RESERVATION_UNIT_RELEASED",
    label: "MyUnits.Calendar.legend.reservationUnitReleased",
    style: RESERVATION_UNIT_RELEASED.style,
  },
  {
    key: "RESERVATION_UNIT_DRAFT",
    label: "MyUnits.Calendar.legend.reservationUnitDraft",
    style: RESERVATION_UNIT_DRAFT.style,
  },
];

const eventStyleGetter =
  (currentReservationUnitPk: number) =>
  ({
    event,
  }: CalendarEvent<ReservationType>): {
    style: React.CSSProperties;
    className?: string;
  } => {
    const isCurrentReservationUnit = !!event?.reservationUnits?.find(
      (ru) => ru?.pk === currentReservationUnitPk
    );

    const isConfirmed =
      event?.state === ReservationsReservationStateChoices.Confirmed;
    const isWaitingForPayment =
      event?.state === ReservationsReservationStateChoices.WaitingForPayment;

    const isClosed = event?.type === "blocked";
    const isStaff = event?.type === "staff";

    const style = {
      ...EVENT_STYLE,
    };

    if (isConfirmed && isClosed) {
      Object.assign(style, CLOSED.style);
    } else if (isConfirmed && isStaff) {
      Object.assign(style, STAFF_RESERVATION.style);
    } else if (isWaitingForPayment) {
      Object.assign(style, WAITING_PAYMENT.style);
    } else if (isConfirmed) {
      Object.assign(style, CONFIRMED.style);
    } else {
      Object.assign(style, UNCONFIRMED.style);
    }

    if (!isCurrentReservationUnit) {
      Object.assign(style, INTERSECTING_RESERVATION_UNIT.style);
    }

    return {
      style,
    };
  };

export default eventStyleGetter;
