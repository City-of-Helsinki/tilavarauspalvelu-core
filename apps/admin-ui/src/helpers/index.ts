/// Plain js / ts helper functions
import {
  ReservationTypeChoice,
  ApplicantTypeChoice,
  type PersonNode,
  type ReservationsInIntervalFragment,
  ApplicationNode,
  ApplicationRoundReservationCreationStatusChoice,
  ApplicationRoundStatusChoice,
  type ApplicationRoundNode,
  type Maybe,
  ReservationStartInterval,
} from "@gql/gql-types";
import { addSeconds } from "date-fns";

export { truncate } from "common/src/helpers";

export * from "./date";

export type CollisionInterval = {
  start: Date;
  end: Date;
  buffers: { before: number; after: number };
  type?: ReservationTypeChoice;
  recurringReservationPk?: number;
};

/// @brief Check if two intervals collide
export function doesIntervalCollide(
  a: CollisionInterval,
  b: CollisionInterval
): boolean {
  const aEndBuffer = Math.max(a.buffers.after, b.buffers.before);
  const bEndBuffer = Math.max(a.buffers.before, b.buffers.after);
  if (a.start < b.start && addSeconds(a.end, aEndBuffer) <= b.start)
    return false;
  if (a.start >= addSeconds(b.end, bEndBuffer) && a.end > b.end) return false;
  return true;
}

export function getBufferTime(
  b: Maybe<number> | undefined,
  t: Maybe<ReservationTypeChoice> | undefined
): number {
  if (t === ReservationTypeChoice.Blocked) {
    return 0;
  }
  return b ?? 0;
}

/// @brief Create a collision interval from a reservation
/// @param x Reservation
/// @param comparisonReservationType the type of the reservation that is being compared to
/// @return Interval
/// @desc Special handling for Blocked reservations since they don't collide with buffers.
export function reservationToInterval(
  x: ReservationsInIntervalFragment,
  comparisonReservationType: ReservationTypeChoice
): CollisionInterval | undefined {
  if (!x || !x.begin || !x.end) {
    return undefined;
  }
  const t =
    comparisonReservationType === ReservationTypeChoice.Blocked ||
    x.type === ReservationTypeChoice.Blocked
      ? ReservationTypeChoice.Blocked
      : undefined;
  return {
    start: new Date(x.begin),
    end: new Date(x.end),
    buffers: {
      before: getBufferTime(x.bufferTimeBefore, t),
      after: getBufferTime(x.bufferTimeAfter, t),
    },
    recurringReservationPk: x.recurringReservation?.pk ?? undefined,
    type: x.type ?? undefined,
  };
}

// NOTE optionals (?) are super bad because if you forget to query anything from the object there will be no type errors
// can't remove them because they are not mandatory in the gql schema
// maybe using an utility function that forces subobjects to NonNullable could work for this.
type Application = {
  applicantType?:
    | Pick<ApplicationNode, "applicantType">["applicantType"]
    | null
    | undefined;
  contactPerson?: Pick<PersonNode, "firstName" | "lastName"> | null | undefined;
  organisation?:
    | Pick<
        NonNullable<Pick<ApplicationNode, "organisation">["organisation"]>,
        "nameFi"
      >
    | null
    | undefined;
};
export function getApplicantName(app?: Application | undefined | null): string {
  if (!app) {
    return "-";
  }
  if (app.applicantType === ApplicantTypeChoice.Individual) {
    const { firstName, lastName } = app.contactPerson || {};
    return `${firstName || "-"} ${lastName || "-"}`;
  }
  return app.organisation?.nameFi || "-";
}

export function isApplicationRoundInProgress(
  round:
    | Maybe<Pick<ApplicationRoundNode, "status" | "reservationCreationStatus">>
    | undefined
): boolean {
  if (!round) {
    return false;
  }
  return (
    round.reservationCreationStatus ===
      ApplicationRoundReservationCreationStatusChoice.NotCompleted &&
    round.status === ApplicationRoundStatusChoice.Handled
  );
}

/// @brief Normalize the interval to 15 or 30 minutes
/// @param interval
/// @return Normalized interval
/// @desc reservations made in the admin ui don't follow the customer interval rules
export function getNormalizedInterval(
  interval: Maybe<ReservationStartInterval> | undefined
) {
  return interval === ReservationStartInterval.Interval_15Mins
    ? ReservationStartInterval.Interval_15Mins
    : ReservationStartInterval.Interval_30Mins;
}
