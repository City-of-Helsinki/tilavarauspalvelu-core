import { useTranslation } from "next-i18next";
import { type Maybe, useReservationSeriesQuery } from "@gql/gql-types";
import { errorToast } from "common/src/components/toast";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

/// @param recurringPk fetch reservations related to this pk
/// @param state optionally only fetch some reservation states
/// @param limit allows to over fetch: 100 is the limit per query, larger amounts are done with multiple fetches
export function useReservationSeries(recurringPk: Maybe<number> | undefined) {
  const { t } = useTranslation();

  const id = base64encode(`ReservationSeriesNode:${recurringPk}`);
  const { data, loading, refetch } = useReservationSeriesQuery({
    skip: !recurringPk,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    variables: { id },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const { reservationSeries } = data ?? {};
  const reservations = filterNonNullable(reservationSeries?.reservations);

  return {
    loading,
    reservations,
    reservationSeries,
    refetch,
  };
}

export const RESERVATION_SERIES_QUERY = gql`
  query ReservationSeries($id: ID!) {
    reservationSeries(id: $id) {
      ...ReservationSeriesFields
      reservations {
        id
        handlingDetails
      }
    }
  }
`;
