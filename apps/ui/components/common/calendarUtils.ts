import type { CalendarEvent } from "common/src/calendar/Calendar";
import type { ReservationNode } from "@gql/gql-types";
import React from "react";

type ReservationStateWithInitial = string;

const eventStyleGetter = (
  { event }: CalendarEvent<ReservationNode>,
  ownReservations: number[],
  draggable = true
): { style: React.CSSProperties; className?: string } => {
  const style = {
    borderRadius: "0px",
    opacity: "0.8",
    color: "var(--color-white)",
    display: "block",
    borderColor: "transparent",
  } as Record<string, string>;
  let className = "";

  const eventPk = event != null && "pk" in event ? event.pk : Number(event?.id);
  const isOwn =
    eventPk != null &&
    !Number.isNaN(eventPk) &&
    ownReservations?.includes(eventPk) &&
    (event?.state as ReservationStateWithInitial) !== "BUFFER";

  const state = isOwn ? "OWN" : (event?.state as ReservationStateWithInitial);

  switch (state) {
    case "INITIAL":
      style.backgroundColor = "var(--tilavaraus-event-initial-color)";
      style.color = "var(--color-black)";
      style.border = "2px dashed var(--tilavaraus-event-initial-border)";
      className = draggable ? "rbc-event-movable" : "";
      break;
    case "OWN":
      style.backgroundColor = "var(--tilavaraus-event-initial-color)";
      style.color = "var(--color-black)";
      style.border = "2px solid var(--tilavaraus-event-initial-border)";
      break;
    case "BUFFER":
      style.backgroundColor = "var(--color-black-5)";
      className = "rbc-event-buffer";
      break;
    default:
      style.backgroundColor = "var(--tilavaraus-event-reservation-color)";
      style.border = "2px solid var(--tilavaraus-event-reservation-border)";
      style.color = "var(--color-black)";
  }

  if (event?.isBlocked) {
    style.color = "transparent";
    style.backgroundColor = "var(--color-black-5)";
    style.border = "1px solid var(--color-black-30)";
    style.borderLeft = "2px solid var(--color-black-30)";
    className = "rbc-timeslot-inactive";
  }

  return {
    style,
    className,
  };
};

export { eventStyleGetter };
