import { gql } from "@apollo/client";
import { useReservationPriceQuery } from "@gql/gql-types";
import type { ReservationPriceCalculationFieldsFragment } from "@gql/gql-types";
import type { TimeRange } from "@/modules/reservation";

type ReservationPriceResult = Readonly<{
  reservationPrice: ReservationPriceCalculationFieldsFragment | null;
  /// The price is of the previous time while the price of the selected time loads
  isLoading: boolean;
}>;

/// The price of the selected time, calculated by the backend
export function useReservationPrice(
  reservationUnitPk: number | null | undefined,
  timeRange: TimeRange | null
): ReservationPriceResult {
  const { data, previousData, loading, error } = useReservationPriceQuery({
    skip: reservationUnitPk == null || timeRange == null,
    variables: {
      reservationUnit: reservationUnitPk ?? 0,
      beginsAt: timeRange?.start.toISOString() ?? "",
      endsAt: timeRange?.end.toISOString() ?? "",
    },
  });
  if (timeRange == null || error != null) {
    return { reservationPrice: null, isLoading: false };
  }
  // Keep the previous price while the next one loads, so that the layout does not jump
  return { reservationPrice: (data ?? previousData)?.reservationPrice ?? null, isLoading: loading };
}

export const RESERVATION_PRICE_QUERY = gql`
  query ReservationPrice($reservationUnit: Int!, $beginsAt: DateTime!, $endsAt: DateTime!) {
    reservationPrice(reservationUnit: $reservationUnit, beginsAt: $beginsAt, endsAt: $endsAt) {
      ...ReservationPriceCalculationFields
    }
  }
`;
