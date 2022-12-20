import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationsReservationStateChoices,
  ReservationType,
} from "common/types/gql-types";

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

export const legend = [
  {
    label: "MyUnits.Calendar.legend.confirmed",
    style: CONFIRMED.style,
  },
  {
    label: "MyUnits.Calendar.legend.waitingPayment",
    style: WAITING_PAYMENT.style,
  },
  {
    label: "MyUnits.Calendar.legend.unconfirmed",
    style: UNCONFIRMED.style,
  },
  {
    label: "MyUnits.Calendar.legend.staffReservation",
    style: STAFF_RESERVATION.style,
  },
  {
    label: "MyUnits.Calendar.legend.intersecting",
    style: INTERSECTING_RESERVATION_UNIT.style,
  },
  {
    label: "MyUnits.Calendar.legend.pause",
    style: POST_PAUSE.style,
  },
  {
    label: "MyUnits.Calendar.legend.closed",
    style: CLOSED.style,
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
