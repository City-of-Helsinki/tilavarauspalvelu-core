import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationsReservationStateChoices,
  ReservationType,
} from "common/types/gql-types";

const CURRENT = (state: string) => {
  const lcState = state.toLowerCase();
  return {
    style: {
      backgroundColor: `var(--tilavaraus-event-current-${lcState}-background)`,
      color: `var(--tilavaraus-event-current-${lcState}-color)`,
      border: `2px dashed var(--tilavaraus-event-current-${lcState}-border-color)`,
    },
  };
};

const SELECTED = {
  style: {
    outline: "2px solid var(--color-bus)",
    outlineOffset: "3px",
  },
};

const UNCONFIRMED = {
  style: {
    border: `2px solid var(--tilavaraus-event-other-requires_handling-border-color)`,
    backgroundColor: `var(--tilavaraus-event-other-requires_handling-background)`,
    color: `black`,
  },
};

const REST = {
  style: {
    border: `2px solid var(--tilavaraus-event-rest-border-color)`,
    background: `var(--tilavaraus-event-rest-background)`,
    color: `black`,
  },
};

export const legend = [
  {
    label: "Calendar.legend.currentRequiresHandling",
    style: CURRENT(ReservationsReservationStateChoices.RequiresHandling).style,
  },
  {
    label: "Calendar.legend.currentConfirmed",
    style: CURRENT(ReservationsReservationStateChoices.Confirmed).style,
  },
  {
    label: "Calendar.legend.currentDenied",
    style: CURRENT(ReservationsReservationStateChoices.Denied).style,
  },
  {
    label: "Calendar.legend.otherRequiedHandling",
    style: UNCONFIRMED.style,
  },
  {
    label: "Calendar.legend.rest",
    style: REST.style,
  },
];

const eventStyleGetter =
  (
    currentReservation?: ReservationType,
    selectedReservation?: ReservationType
  ) =>
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
    };

    const isPartOfRecurrance =
      currentReservation?.recurringReservation &&
      currentReservation.recurringReservation?.pk ===
        event?.recurringReservation?.pk;
    if (selectedReservation?.pk === event?.pk) {
      return {
        style: {
          ...style,
          ...CURRENT(event?.state ?? "").style,
          ...SELECTED.style,
        },
      };
    }

    if (currentReservation?.pk === event?.pk || isPartOfRecurrance) {
      Object.assign(style, CURRENT(event?.state ?? "").style);
      style.cursor = "default";
    } else if (event?.state !== ReservationsReservationStateChoices.Confirmed) {
      Object.assign(style, UNCONFIRMED.style);
    } else {
      Object.assign(style, REST.style);
    }
    return {
      style,
    };
  };

export default eventStyleGetter;
