import { gql } from "@apollo/client";
import { useReservationPriceQuery } from "@gql/gql-types";
import type { ReservationPriceCalculationFieldsFragment } from "@gql/gql-types";
import type { TimeRange } from "@/modules/reservation";
import { useDebounce } from "./useDebounce";

/// Wait this long after the last change of the time before the price query is sent.
/// A user who clicks through the calendar or the time options then causes one query, not one for each step.
const RESERVATION_PRICE_DEBOUNCE_MS = 300;

type ReservationPriceResult = Readonly<{
  reservationPrice: ReservationPriceCalculationFieldsFragment | null;
  /// The price is of the previous time while the price of the selected time waits or loads
  isLoading: boolean;
}>;

type PriceVariables = Readonly<{ reservationUnit: number; beginsAt: string; endsAt: string }>;

/// The price of the selected time, calculated by the backend
export function useReservationPrice(
  reservationUnitPk: number | null | undefined,
  timeRange: TimeRange | null
): ReservationPriceResult {
  // Debounce a string, because the callers give a new time range object on each render
  const variablesKey =
    reservationUnitPk != null && timeRange != null
      ? JSON.stringify({
          reservationUnit: reservationUnitPk,
          beginsAt: timeRange.start.toISOString(),
          endsAt: timeRange.end.toISOString(),
        } satisfies PriceVariables)
      : null;
  // The first time is not debounced, so the price shows at once when the page opens
  const debouncedKey = useDebounce(variablesKey, RESERVATION_PRICE_DEBOUNCE_MS);
  const variables = debouncedKey != null ? (JSON.parse(debouncedKey) as PriceVariables) : null;

  const { data, previousData, loading, error } = useReservationPriceQuery({
    skip: variables == null,
    variables: variables ?? { reservationUnit: 0, beginsAt: "", endsAt: "" },
  });
  if (variablesKey == null || error != null) {
    return { reservationPrice: null, isLoading: false };
  }
  // The price of the previous time must not count as the price of the selected time
  const isWaiting = debouncedKey !== variablesKey;
  // Keep the previous price while the next one loads, so that the layout does not jump
  return { reservationPrice: (data ?? previousData)?.reservationPrice ?? null, isLoading: loading || isWaiting };
}

export const RESERVATION_PRICE_QUERY = gql`
  query ReservationPrice($reservationUnit: Int!, $beginsAt: DateTime!, $endsAt: DateTime!) {
    reservationPrice(reservationUnit: $reservationUnit, beginsAt: $beginsAt, endsAt: $endsAt) {
      ...ReservationPriceCalculationFields
    }
  }
`;
