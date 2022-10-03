import { CalendarEvent } from "common/src/calendar/Calendar";
import {
  ReservationsReservationStateChoices,
  ReservationType,
} from "../../../common/gql-types";

const eventStyleGetter =
  (currentReservation: ReservationType) =>
  ({
    event,
  }: CalendarEvent<ReservationType>): {
    style: React.CSSProperties;
    className?: string;
  } => {
    const style = {
      borderRadius: "0px",
      opacity: "0.8",
      color: "var(--color-white)",
      display: "block",
      borderColor: "transparent",
      padding: "3px 6px",
      fontSize: "var(--fontsize-body-s)",
    } as Record<string, string>;

    const state = event?.state.toLowerCase() as string;

    if (currentReservation.pk === event?.pk) {
      // current reservation
      style.backgroundColor = `var(--tilavaraus-event-current-${state}-background)`;
      style.color = `var(--tilavaraus-event-current-${state}-color)`;
      style.border = `2px dashed var(--tilavaraus-event-current-${state}-border-color)`;
      style.class = "current";
    } else if (event?.state !== ReservationsReservationStateChoices.Confirmed) {
      style.border = `2px solid var(--tilavaraus-event-other-requires_handling-border-color)`;
      style.backgroundColor = `var(--tilavaraus-event-other-requires_handling-background)`;
      style.color = `black`;
    } else {
      style.border = `2px solid var(--tilavaraus-event-rest-border-color)`;
      style.background = `var(--tilavaraus-event-rest-background)`;
      style.color = `black`;
    }
    return {
      style,
    };
  };

export default eventStyleGetter;
