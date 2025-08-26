import { useTranslation } from "next-i18next";
import { type Maybe, useReservationSeriesQuery } from "@gql/gql-types";
import { errorToast } from "common/src/components/toast";
import { createNodeId, filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

/// @param recurringPk fetch reservations related to this pk
/// @param state optionally only fetch some reservation states
/// @param limit allows to over fetch: 100 is the limit per query, larger amounts are done with multiple fetches
export function useReservationSeries(recurringPk: Maybe<number> | undefined) {
  const { t } = useTranslation();

  const { data, loading, refetch } = useReservationSeriesQuery({
    skip: !recurringPk,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    variables: { id: createNodeId("ReservationSeriesNode", recurringPk ?? 0) },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const reservationSeries = data?.node != null && "pk" in data.node ? data.node : null;
  const reservations = filterNonNullable(reservationSeries?.reservations);

  return {
    reservations,
    reservationSeries,
    loading,
    refetch,
  };
}

export const RESERVATION_SERIES_QUERY = gql`
  query ReservationSeries($id: ID!) {
    node(id: $id) {
      ... on ReservationSeriesNode {
        ...ReservationSeriesFields
        reservations {
          id
          handlingDetails
        }
      }
    }
  }
`;
