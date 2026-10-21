import type { CalendarEvent } from "@ui/components/calendar/types";
import type { ReservationNode } from "@gql/gql-types";

type ReservationStateWithInitial = string;

export const eventStyleGetter = (
  { event }: CalendarEvent<ReservationNode>,
  ownReservations: number[],
  draggable = true
): { style: React.CSSProperties; isMovable: boolean; isBuffer: boolean; isBlocked: boolean } => {
  const style = {
    color: "var(--color-white)",
    display: "block",
  } as Record<string, string>;
  let isMovable = false;
  let isBuffer = false;

  const eventPk = event?.pk;
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
      style.borderInline = "2px dashed var(--tilavaraus-event-initial-border)";
      isMovable = draggable;
      break;
    case "OWN":
      style.backgroundColor = "var(--tilavaraus-event-initial-color)";
      style.color = "var(--color-black)";
      style.borderInline = "2px solid var(--tilavaraus-event-initial-border)";
      break;
    case "BUFFER":
      style.backgroundColor = "var(--color-black-5)";
      isBuffer = true;
      break;
    default:
      style.backgroundColor = "var(--tilavaraus-event-reservation-color)";
      style.borderInline = "2px solid var(--tilavaraus-event-reservation-border)";
      style.color = "var(--color-black)";
  }

  if (event?.isBlocked) {
    style.color = "transparent";
    style.backgroundColor = "var(--color-black-5)";
    style.border = "1px solid var(--color-black-30)";
    style.borderLeft = "2px solid var(--color-black-30)";
  }

  return {
    style,
    isMovable,
    isBuffer,
    isBlocked: Boolean(event?.isBlocked),
  };
};
