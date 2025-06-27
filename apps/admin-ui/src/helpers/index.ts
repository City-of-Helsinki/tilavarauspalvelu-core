import { gql } from "@apollo/client";
import {
  ReservationTypeChoice,
  ApplicantTypeChoice,
  type CalendarReservationFragment,
  type ApplicantNameFieldsFragment,
  ApplicationRoundReservationCreationStatusChoice,
  ApplicationRoundStatusChoice,
  type ApplicationRoundNode,
  type Maybe,
  ReservationStartInterval,
  type CombineAffectedReservationsFragment,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { addSeconds } from "date-fns";

export { truncate } from "common/src/helpers";

export * from "./date";

export type CollisionInterval = {
  start: Date;
  end: Date;
  buffers: { before: number; after: number };
  type?: ReservationTypeChoice;
  reservationSeriesPk?: number;
};

/// @brief Check if two intervals collide
export function doesIntervalCollide(a: CollisionInterval, b: CollisionInterval): boolean {
  const aEndBuffer = Math.max(a.buffers.after, b.buffers.before);
  const bEndBuffer = Math.max(a.buffers.before, b.buffers.after);
  if (a.start < b.start && addSeconds(a.end, aEndBuffer) <= b.start) return false;
  if (a.start >= addSeconds(b.end, bEndBuffer) && a.end > b.end) return false;
  return true;
}

export function getBufferTime(
  buffer: Maybe<number> | undefined,
  type: Maybe<ReservationTypeChoice>,
  enabled?: boolean
): number {
  if (!enabled) {
    return 0;
  }
  if (type === ReservationTypeChoice.Blocked) {
    return 0;
  }
  return buffer ?? 0;
}

/// @brief Create a collision interval from a reservation
/// @param x Reservation
/// @param comparisonReservationType the type of the reservation that is being compared to
/// @return Interval
/// @desc Special handling for Blocked reservations since they don't collide with buffers.
export function reservationToInterval(
  x: Pick<
    CalendarReservationFragment,
    "beginsAt" | "endsAt" | "bufferTimeBefore" | "bufferTimeAfter" | "reservationSeries" | "type"
  >,
  comparisonReservationType: ReservationTypeChoice
): CollisionInterval | null {
  if (!x || !x.beginsAt || !x.endsAt) {
    return null;
  }
  const t = x.type === ReservationTypeChoice.Blocked ? ReservationTypeChoice.Blocked : comparisonReservationType;
  return {
    start: new Date(x.beginsAt),
    end: new Date(x.endsAt),
    buffers: {
      before: getBufferTime(x.bufferTimeBefore, t),
      after: getBufferTime(x.bufferTimeAfter, t),
    },
    reservationSeriesPk: x.reservationSeries?.pk ?? undefined,
    type: x.type ?? undefined,
  };
}

// NOTE: because we are combining two queries here we need to manually define the type
// this is type safe because this is gonna type error if the endpoints change
type AffectedReservations = {
  reservationUnit: Readonly<{
    reservations: readonly CombineAffectedReservationsFragment[] | null;
  }> | null;
  affectingReservations: readonly CombineAffectedReservationsFragment[] | null;
};

/// Minimal fragment for combining affected reservations (inherit this for any queries using affectedReservations)
export const COMBINE_AFFECTED_RESERVATIONS_FRAGMENT = gql`
  fragment CombineAffectedReservations on ReservationNode {
    id
    pk
    affectedReservationUnits
  }
`;

function isAffecting(
  reservation: Pick<CombineAffectedReservationsFragment, "affectedReservationUnits">,
  resUnitPk: number
) {
  return reservation.affectedReservationUnits?.some((pk) => pk === resUnitPk);
}
export function combineAffectingReservations<T extends AffectedReservations>(
  data: Maybe<T> | undefined,
  reservationUnitPk: Maybe<number> | undefined
): NonNullable<NonNullable<T["reservationUnit"]>["reservations"]> {
  if (data == null || reservationUnitPk == null) {
    return [];
  }

  // NOTE we could use a recular concat here (we only have single reservationUnit here)
  const affectingReservations = filterNonNullable(data.affectingReservations).filter((y) =>
    isAffecting(y, reservationUnitPk)
  );
  const reservationSet = filterNonNullable(data.reservationUnit?.reservations).concat(affectingReservations);
  return filterNonNullable(reservationSet);
}

export const APPLICANT_NAME_FRAGMENT = gql`
  fragment ApplicantNameFields on ApplicationNode {
    id
    applicantType
    contactPerson {
      id
      firstName
      lastName
    }
    organisation {
      id
      nameFi
    }
  }
`;

export function getApplicantName(app: ApplicantNameFieldsFragment): string {
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
  round: Maybe<Pick<ApplicationRoundNode, "status" | "reservationCreationStatus">> | undefined
): boolean {
  if (!round) {
    return false;
  }
  return (
    round.reservationCreationStatus === ApplicationRoundReservationCreationStatusChoice.NotCompleted &&
    round.status === ApplicationRoundStatusChoice.Handled
  );
}

/// @brief Normalize the interval to 15 or 30 minutes
/// @param interval
/// @return Normalized interval
/// @desc reservations made in the admin ui don't follow the customer interval rules
export function getNormalizedInterval(interval: Maybe<ReservationStartInterval> | undefined) {
  return interval === ReservationStartInterval.Interval_15Mins
    ? ReservationStartInterval.Interval_15Mins
    : ReservationStartInterval.Interval_30Mins;
}
