import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationsReservationStateChoices,
  ReservationType,
} from "common/types/gql-types";

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

const CONFIRMED = {
  style: {
    borderColor: "var(--color-success)",
    borderStyle: "solid",
    borderWidth: "2px 0px",
    background: "var(--color-success-light)",
    color: "black",
  },
};

const WAITING_PAYMENT = {
  style: {
    borderColor: "var(--color-success)",
    borderStyle: "dashed",
    borderWidth: "2px 0px",
    background: "var(--color-success-light)",
    color: "black",
  },
};

const UNCONFIRMED = {
  style: {
    borderColor: "var(--tilavaraus-event-other-requires_handling-border-color)",
    borderStyle: "dashed",
    borderWidth: "2px 0px",
    background: "var(--tilavaraus-event-other-requires_handling-background)",
    color: "black",
  },
};

const STAFF_RESERVATION = {
  style: {
    borderColor: "var(--color-gold)",
    borderStyle: "double",
    borderWidth: "2px 0px",
    background: "var(--color-gold-light)",
    color: "black",
  },
};

const INTERSECTING_RESERVATION_UNIT = {
  style: {
    backgroundColor: "var(--color-white)",
    backgroundImage:
      'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd0cmFuc3BhcmVudCcvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J3JnYigxNTAsMTUwLDE1MCknIHN0cm9rZS13aWR0aD0nMScvPgo8L3N2Zz4="',
    backgroundRepeat: "repeat",
    backgroundSize: "5px",
  },
};
export const PRE_PAUSE = {
  style: {
    borderColor: "var(--color-black-40)",
    borderStyle: "double",
    borderWidth: "0px 0px 0px 2px",
    background: "var(--color-black-10)",
    color: "black",
  },
};

export const POST_PAUSE = {
  style: {
    borderColor: "var(--color-black-40)",
    borderStyle: "double",
    borderWidth: "0px 2px 0px 0px",
    background: "var(--color-black-10)",
    color: "black",
  },
};

const CLOSED = {
  style: {
    border: "none",
    backgroundColor: "var(--color-black-20)",
    color: "black",
  },
};

const RESERVATION_UNIT_RELEASED = {
  style: {
    borderColor: "var(--color-black-20)",
    borderStyle: "solid",
    borderWidth: "0px 0px 0px 2px",
    background: "var(--color-white)",
    color: "black",
  },
};

const RESERVATION_UNIT_DRAFT = {
  style: {
    borderColor: "var(--color-alert-dark)",
    borderStyle: "dashed",
    borderWidth: "0px 0px 0px 2px",
    background: "var(--color-white)",
    color: "black",
    width: "4px",
  },
};

export const legend: EventStyle[] = [
  {
    key: "CONFIRMED",
    label: "MyUnits.Calendar.legend.confirmed",
    style: CONFIRMED.style,
  },
  {
    key: "WAITING_PAYMENT",
    label: "MyUnits.Calendar.legend.waitingPayment",
    style: WAITING_PAYMENT.style,
  },
  {
    key: "UNCONFIRMED",
    label: "MyUnits.Calendar.legend.unconfirmed",
    style: UNCONFIRMED.style,
  },
  {
    key: "STAFF_RESERVATION",
    label: "MyUnits.Calendar.legend.staffReservation",
    style: STAFF_RESERVATION.style,
  },
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
    const style = {
      cursor: "pointer",
      borderRadius: "0px",
      color: "var(--color-white)",
      display: "block",
      borderColor: "transparent",
      fontSize: "var(--fontsize-body-s)",
      opacity: 0.8,
      zIndex: 100,
    } as React.CSSProperties;

    const isCurrentReservationUnit = !!event?.reservationUnits?.find((ru) => {
      return ru?.pk === currentReservationUnitPk;
    });

    const isConfirmed =
      event?.state === ReservationsReservationStateChoices.Confirmed;

    if (isConfirmed) {
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
