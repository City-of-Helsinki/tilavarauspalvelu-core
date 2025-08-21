import { addYears } from "date-fns";
import { gql } from "@apollo/client";
import { useAffectingReservationsQuery } from "@/gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { toApiDate } from "common/src/common/util";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { BLOCKING_RESERVATIONS_POLL_INTERVAL } from "@/modules/const";

// NOTE use client side polling because
// - it gets outdated fast (somebody else makes a reservation)
// - it's outdated if the user cancels current reservation (dangling tentative reservation)
// - it's relatively expensive (since we are taking 2 year time span, instead of just the required single week)
// other considerations
// - it's below the fold
// - it's inside a Calendar component (mostly) so no layout shifts
export function useBlockingReservations(
  reservationUnitPk: number | null,
  currentReservationPk?: number | null,
  beginDate?: Date,
  endDate?: Date
) {
  const begin = beginDate ?? new Date();
  const end = endDate ?? addYears(new Date(), 2);
  const { data, ...rest } = useAffectingReservationsQuery({
    pollInterval: BLOCKING_RESERVATIONS_POLL_INTERVAL,
    skip: reservationUnitPk == null || reservationUnitPk < 1,
    // no-cache because we are polling and have no pagination
    // Apollo cant automatically merge when reservation is deleted
    fetchPolicy: "no-cache",
    variables: {
      pk: reservationUnitPk ?? 0,
      beginDate: toApiDate(begin) ?? "",
      endDate: toApiDate(end) ?? "",
      state: RELATED_RESERVATION_STATES,
    },
  });

  const blockingReservations = filterNonNullable(data?.affectingReservations).filter(
    (r) => r.pk !== currentReservationPk
  );

  return {
    blockingReservations,
    ...rest,
  };
}

export const AFFECTING_RESERVATIONS_QUERY = gql`
  query AffectingReservations($pk: Int!, $beginDate: Date!, $endDate: Date!, $state: [ReservationStateChoice!]) {
    affectingReservations(forReservationUnits: [$pk], beginDate: $beginDate, endDate: $endDate, state: $state) {
      ...BlockingReservationFields
    }
  }
`;
