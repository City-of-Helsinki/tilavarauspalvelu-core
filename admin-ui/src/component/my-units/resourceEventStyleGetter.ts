import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationsReservationStateChoices,
  ReservationType,
} from "../../common/gql-types";

const CONFIRMED_BORDER = "2px solid var(--color-success)";

const CONFIRMED = {
  style: {
    borderTop: CONFIRMED_BORDER,
    borderBottom: CONFIRMED_BORDER,
    background: "var(--color-success-light)",
    color: "black",
  },
};

const UNCONFIRMED_BORDER = "2px dashed var(--color-gold)";

const UNCONFIRMED = {
  style: {
    borderTop: UNCONFIRMED_BORDER,
    borderBottom: UNCONFIRMED_BORDER,
    backgroundColor: "var(--color-gold-light)",
    color: "black",
  },
};

const INTERSECTING_RESERVATION_UNIT = {
  style: {
    backgroundImage:
      'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd0cmFuc3BhcmVudCcvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J3JnYigxNTAsMTUwLDE1MCknIHN0cm9rZS13aWR0aD0nMScvPgo8L3N2Zz4="',
    backgroundRepeat: "repeat",
    backgroundSize: "5px",
  } as React.CSSProperties,
};

const PAUSE = {
  style: {
    borderRight: "1px solid var(--color-black-40)",
    backgroundColor: "var(--color-black-10)",
    color: "black",
  },
};

const CLOSED = {
  style: {
    border: "none",
    backgroundColor: "var(--color-black-40)",
    color: "black",
  },
};

export const legend = [
  {
    label: "MyUnits.UnitCalendar.legend.confirmed",
    style: CONFIRMED.style,
  },
  {
    label: "MyUnits.UnitCalendar.legend.unconfirmed",
    style: UNCONFIRMED.style,
  },
  {
    label: "MyUnits.UnitCalendar.legend.intersecting",
    style: { ...CONFIRMED.style, ...INTERSECTING_RESERVATION_UNIT.style },
  },
  {
    label: "MyUnits.UnitCalendar.legend.pause",
    style: PAUSE.style,
  },
  {
    label: "MyUnits.UnitCalendar.legend.closed",
    style: CLOSED.style,
  },
];

const resourceEventStyleGetter =
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

export default resourceEventStyleGetter;
