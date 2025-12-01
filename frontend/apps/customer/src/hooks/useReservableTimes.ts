import { useMemo } from "react";
import { filterNonNullable } from "ui/src/modules/helpers";
import { generateReservableMap } from "@/modules/reservable";
import type { ReservableMap } from "@/modules/reservable";
import type { ReservationUnitNode } from "@gql/gql-types";

/**
 * Hook that generates a map of reservable time spans from a reservation unit
 * Memoizes the result to avoid recalculation on every render
 * @param reservationUnit - Reservation unit with reservableTimeSpans
 * @returns ReservableMap containing reservable time ranges organized by date
 */
export function useReservableTimes(reservationUnit: Pick<ReservationUnitNode, "reservableTimeSpans">): ReservableMap {
  const timespans: ReservableMap = useMemo(() => {
    const reservableTimeSpans = filterNonNullable(reservationUnit.reservableTimeSpans);
    return generateReservableMap(reservableTimeSpans);
  }, [reservationUnit.reservableTimeSpans]);

  return timespans;
}
