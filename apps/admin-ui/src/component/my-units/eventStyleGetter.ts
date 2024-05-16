import { type CalendarEvent } from "common/src/calendar/Calendar";
import {
  State,
  ReservationTypeChoice,
  type ReservationUnitReservationsFragment,
} from "@gql/gql-types";
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
} from "@/common/calendarStyling";

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

type CalendarEventType = CalendarEvent<ReservationUnitReservationsFragment>;
const eventStyleGetter =
  (currentReservationUnitPk: number) =>
  ({
    event,
  }: CalendarEventType): {
    style: React.CSSProperties;
    className?: string;
  } => {
    const isCurrentReservationUnit = !!event?.reservationUnit?.find(
      (ru) => ru?.pk === currentReservationUnitPk
    );

    const isConfirmed = event?.state === State.Confirmed;
    const isWaitingForPayment = event?.state === State.WaitingForPayment;

    const isClosed = event?.type === ReservationTypeChoice.Blocked;
    const isStaff = event?.type === ReservationTypeChoice.Staff;
    // @ts-expect-error: TODO: we are dynamically overriding an enum upstream
    const isBuffer = event?.state === "BUFFER";

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
    } else if (isBuffer) {
      Object.assign(style, { ...POST_PAUSE.style, border: 0 });
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
