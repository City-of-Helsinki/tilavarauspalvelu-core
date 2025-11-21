import { useMemo } from "react";
import { gql } from "@apollo/client";
import { startOfDay } from "date-fns";
import { formatApiDate } from "ui/src/modules/date-utils";
import { useSession } from "@/hooks";
import { useHandlingDataQuery, ReservationStateChoice } from "@gql/gql-types";

/**
 * Hook that fetches reservations requiring handling and units with permissions
 * Only executes query when user is authenticated
 * @returns Object containing handlingCount (number of reservations requiring handling),
 *          hasOwnUnits (whether user has units), and refetch function
 */
export function useHandling() {
  const { isAuthenticated } = useSession();

  const today = useMemo(() => startOfDay(new Date()), []);
  const { data, refetch } = useHandlingDataQuery({
    skip: !isAuthenticated,
    variables: {
      beginDate: formatApiDate(today) ?? "",
      state: ReservationStateChoice.RequiresHandling,
    },
  });

  const handlingCount: number = data?.reservations?.edges?.length ?? 0;
  const unitCount: number = data?.unitsAll?.length ?? 0;
  const hasOwnUnits: boolean = unitCount > 0;

  return { handlingCount, hasOwnUnits, refetch };
}

export const HANDLING_COUNT_QUERY = gql`
  query HandlingData($beginDate: Date!, $state: [ReservationStateChoice]!) {
    reservations(state: $state, beginDate: $beginDate, onlyWithHandlingPermission: true) {
      edges {
        node {
          id
          pk
        }
      }
    }
    unitsAll(onlyWithPermission: true) {
      id
    }
  }
`;
