import { ReservationsReservationStateChoices } from "common/types/gql-types";
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
export const isPossibleToApprove = (
  state: ReservationsReservationStateChoices,
  end: Date
): boolean =>
  state === ReservationsReservationStateChoices.RequiresHandling &&
  end > new Date();

export const isPossibleToDeny = (
  state: ReservationsReservationStateChoices,
  end: Date
): boolean => {
  if (state === ReservationsReservationStateChoices.RequiresHandling) {
    return true;
  }
  return (
    state === ReservationsReservationStateChoices.Confirmed && end > new Date()
  );
};

export const isPossibleToReturn = (
  state: ReservationsReservationStateChoices,
  end: Date
): boolean =>
  (state === ReservationsReservationStateChoices.Denied ||
    state === ReservationsReservationStateChoices.Confirmed) &&
  end > new Date();

export const isPossibleToEdit = (
  state: ReservationsReservationStateChoices,
  end: Date
): boolean => {
  if (state !== ReservationsReservationStateChoices.Confirmed) {
    return false;
  }
  const now = new Date();
  return end > addHours(now, -1) || isToday(end);
};
