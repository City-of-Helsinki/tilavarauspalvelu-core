/// Plain js / ts helper functions
import {
  ReservationTypeChoice,
  ApplicantTypeChoice,
  ApplicationSectionStatusChoice,
  ApplicationStatusChoice,
  type PersonNode,
  type ReservationsInIntervalFragment,
  ApplicationNode,
  ApplicationRoundReservationCreationStatusChoice,
  ApplicationRoundStatusChoice,
  type ApplicationRoundNode,
  type Maybe,
} from "@gql/gql-types";
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
  x: ReservationsInIntervalFragment,
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

type Application = {
  applicantType?:
    | Pick<ApplicationNode, "applicantType">["applicantType"]
    | null;
  contactPerson?: Pick<PersonNode, "firstName" | "lastName"> | null;
  organisation?: Pick<
    NonNullable<Pick<ApplicationNode, "organisation">["organisation"]>,
    "name"
  > | null;
};
export function getApplicantName(app?: Application | undefined | null): string {
  if (!app) {
    return "-";
  }
  if (app.applicantType === ApplicantTypeChoice.Individual) {
    const { firstName, lastName } = app.contactPerson || {};
    return `${firstName || "-"} ${lastName || "-"}`;
  }
  return app.organisation?.name || "-";
}

export function getApplicationStatusColor(
  status: ApplicationStatusChoice,
  size: "s" | "l"
): string {
  switch (status) {
    case ApplicationStatusChoice.Handled:
      return "var(--color-info)";
    case ApplicationStatusChoice.InAllocation:
      return "var(--color-alert-dark)";
    case ApplicationStatusChoice.Received:
    case ApplicationStatusChoice.Draft:
    case ApplicationStatusChoice.ResultsSent:
      return "var(--color-white)";
    case ApplicationStatusChoice.Expired:
    case ApplicationStatusChoice.Cancelled:
    default:
      switch (size) {
        case "s":
          return "var(--color-error)";
        case "l":
        default:
          return "var(--color-error-dark)";
      }
  }
}

export function getApplicationSectiontatusColor(
  status: ApplicationSectionStatusChoice
): string {
  switch (status) {
    case ApplicationSectionStatusChoice.Unallocated:
    case ApplicationSectionStatusChoice.InAllocation:
      return "var(--color-alert-dark)";
    case ApplicationSectionStatusChoice.Handled:
      return "var(--color-success)";
    case ApplicationSectionStatusChoice.Rejected:
    default:
      return "var(--color-error)";
  }
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
