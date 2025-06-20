import { useTranslation } from "next-i18next";
import { type Maybe, useRecurringReservationQuery } from "@gql/gql-types";
import { errorToast } from "common/src/common/toast";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

/// @param recurringPk fetch reservations related to this pk
/// @param state optionally only fetch some reservation states
/// @param limit allows to over fetch: 100 is the limit per query, larger amounts are done with multiple fetches
export function useRecurringReservations(recurringPk: Maybe<number> | undefined) {
  const { t } = useTranslation();

  const id = base64encode(`RecurringReservationNode:${recurringPk}`);
  const { data, loading, refetch } = useRecurringReservationQuery({
    skip: !recurringPk,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    variables: { id },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });

  const { recurringReservation } = data ?? {};
  const reservations = filterNonNullable(recurringReservation?.reservations);

  return {
    loading,
    reservations,
    recurringReservation,
    refetch,
  };
}

export const RECURRING_RESERVATION_QUERY = gql`
  query RecurringReservation($id: ID!) {
    recurringReservation(id: $id) {
      ...RecurringReservationFields
      reservations {
        id
        handlingDetails
      }
    }
  }
`;
