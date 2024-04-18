/// Plain js / ts helper functions
import {
  type ReservationNode,
  ReservationTypeChoice,
} from "common/types/gql-types";
import { addSeconds } from "date-fns";

export { truncate } from "common/src/helpers";

export * from "./date";

export type CollisionInterval = {
  start: Date;
  end: Date;
  buffers: { before: number; after: number };
  type?: ReservationTypeChoice;
};

/// @brief Check if two intervals collide
export const doesIntervalCollide = (
  a: CollisionInterval,
  b: CollisionInterval
): boolean => {
  const aEndBuffer = Math.max(a.buffers.after, b.buffers.before);
  const bEndBuffer = Math.max(a.buffers.before, b.buffers.after);
  if (a.start < b.start && addSeconds(a.end, aEndBuffer) <= b.start)
    return false;
  if (a.start >= addSeconds(b.end, bEndBuffer) && a.end > b.end) return false;
  return true;
};

/// @brief Create a collision interval from a reservation
/// @param x Reservation
/// @param comparisonReservationType the type of the reservation that is being compared to
/// @return Interval
/// @desc Special handling for Blocked reservations since they don't collide with buffers.
export const reservationToInterval = (
  x: ReservationNode,
  comparisonReservationType: ReservationTypeChoice
): CollisionInterval | undefined => {
  if (!x || !x.begin || !x.end) {
    return undefined;
  }
  return {
    start: new Date(x.begin),
    end: new Date(x.end),
    buffers: {
      before:
        comparisonReservationType !== ReservationTypeChoice.Blocked &&
        x.type !== ReservationTypeChoice.Blocked &&
        x.bufferTimeBefore
          ? x.bufferTimeBefore
          : 0,
      after:
        comparisonReservationType !== ReservationTypeChoice.Blocked &&
        x.type !== ReservationTypeChoice.Blocked &&
        x.bufferTimeAfter
          ? x.bufferTimeAfter
          : 0,
    },
    type: x.type ?? undefined,
  };
};
