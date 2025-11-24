import { useMemo } from "react";
import { filterNonNullable } from "ui/src/modules/helpers";
import { generateReservableMap } from "@/modules/reservable";
import type { ReservableMap } from "@/modules/reservable";
import type { ReservationUnitNode } from "@gql/gql-types";

export function useReservableTimes(reservationUnit: Pick<ReservationUnitNode, "reservableTimeSpans">): ReservableMap {
  const timespans: ReservableMap = useMemo(() => {
    const reservableTimeSpans = filterNonNullable(reservationUnit.reservableTimeSpans);
    return generateReservableMap(reservableTimeSpans);
  }, [reservationUnit.reservableTimeSpans]);

  return timespans;
}
