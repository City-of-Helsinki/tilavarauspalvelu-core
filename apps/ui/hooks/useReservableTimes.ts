import { ReservationUnitNode } from "@/gql/gql-types";
import {
  generateReservableMap,
  type ReservableMap,
} from "@/modules/reservation";
import { filterNonNullable } from "common/src/helpers";
import { useMemo } from "react";

export function useReservableTimes(
  reservationUnit: Pick<ReservationUnitNode, "reservableTimeSpans">
): ReservableMap {
  const timespans: ReservableMap = useMemo(() => {
    const reservableTimeSpans = filterNonNullable(
      reservationUnit.reservableTimeSpans
    );
    return generateReservableMap(reservableTimeSpans);
  }, [reservationUnit.reservableTimeSpans]);

  return timespans;
}
