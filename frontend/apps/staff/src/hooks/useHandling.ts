import { gql } from "@apollo/client";
import { formatApiDate } from "ui/src/modules/date-utils";
import { useHandlingDataQuery, ReservationStateChoice } from "@gql/gql-types";
import type { HandlingDataQueryVariables } from "@gql/gql-types";
/* eslint-disable-next-line import/no-cycle */
import { useSession } from "@/hooks";

/// Use the same variables for the server query, the cache write and the hook, so the cache keys match.
export function getHandlingDataVariables(): HandlingDataQueryVariables {
  return {
    beginDate: formatApiDate(new Date()) ?? "",
    state: ReservationStateChoice.RequiresHandling,
  };
}

export function useHandling() {
  const { isAuthenticated } = useSession();

  const { data, refetch } = useHandlingDataQuery({
    skip: !isAuthenticated,
    variables: getHandlingDataVariables(),
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
