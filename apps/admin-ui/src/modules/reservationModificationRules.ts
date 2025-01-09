import { Maybe, ReservationStateChoice } from "@gql/gql-types";
import { addHours, isToday } from "date-fns";

/* Rules
 * Approve only if REQUIRES_HANDLING
 * Deny if REQUIRES_HANDLING or CONFIRMED
 * Return to handling if DENIED or CONFIRMED
 * Other states (e.g. WAITING_FOR_PAYMENT) are not allowed to be modified
 *
 * Allowed to change state (except deny unconfirmed) only till it's ended.
 * Allowed to modify the reservation after ending as long as it's the same date or within one hour.
 */
export function isPossibleToApprove(
  state: ReservationStateChoice,
  end: Date
): boolean {
  return state === ReservationStateChoice.RequiresHandling && end > new Date();
}

/// for regular reservations they can be denied until the end
/// a full series of reservations can only be denied till the start of the last one
export function isPossibleToDeny(
  state: Maybe<ReservationStateChoice> | undefined,
  end: Date
): boolean {
  if (state === ReservationStateChoice.RequiresHandling) {
    return true;
  }
  return state === ReservationStateChoice.Confirmed && end > new Date();
}

export function isPossibleToReturn(
  state: ReservationStateChoice,
  end: Date
): boolean {
  if (
    state !== ReservationStateChoice.Denied &&
    state !== ReservationStateChoice.Confirmed
  ) {
    return false;
  }

  return end > new Date();
}

export function isPossibleToEdit(
  state: Maybe<ReservationStateChoice> | undefined | null,
  end: Date
): boolean {
  if (state !== ReservationStateChoice.Confirmed) {
    return false;
  }
  const now = new Date();
  return end > addHours(now, -1) || isToday(end);
}
