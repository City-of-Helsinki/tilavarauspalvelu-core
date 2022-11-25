import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationsReservationStateChoices,
  ReservationType,
} from "common/types/gql-types";

const CONFIRMED = {
  style: {
    border: "2px solid var(--tilavaraus-event-rest-border-color)",
    background: "var(--tilavaraus-event-rest-background)",
    color: "black",
  },
};

const UNCONFIRMED = {
  style: {
    border:
      "2px solid var(--tilavaraus-event-other-requires_handling-border-color)",
    backgroundColor:
      "var(--tilavaraus-event-other-requires_handling-background)",
    color: "black",
  },
};

const INTERSECTING_RESERVATION_UNIT = {
  style: {
    backgroundImage:
      'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd0cmFuc3BhcmVudCcvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J3JnYigxNTAsMTUwLDE1MCknIHN0cm9rZS13aWR0aD0nMScvPgo8L3N2Zz4="',
    backgroundRepeat: "repeat",
  },
};

export const legend = [
  {
    label: "MyUnits.Calendar.legend.unconfirmed",
    style: UNCONFIRMED.style,
  },
  { label: "MyUnits.Calendar.legend.confirmed", style: CONFIRMED.style },
  {
    label: "MyUnits.Calendar.legend.intersecting",
    style: { ...CONFIRMED.style, ...INTERSECTING_RESERVATION_UNIT.style },
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
      opacity: "0.8",
      color: "var(--color-white)",
      display: "block",
      borderColor: "transparent",
      padding: "3px 6px",
      fontSize: "var(--fontsize-body-s)",
    } as Record<string, string>;

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
