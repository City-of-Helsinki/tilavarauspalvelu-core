import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { useSession } from "@/hooks/auth";
import { useHandlingDataQuery } from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { ReservationStateChoice } from "common/gql/gql-types";
import { gql } from "@apollo/client";

export function useHandling() {
  const { isAuthenticated } = useSession();

  const today = useMemo(() => startOfDay(new Date()), []);
  const { data, refetch } = useHandlingDataQuery({
    skip: !isAuthenticated,
    fetchPolicy: "no-cache",
    variables: {
      beginDate: toApiDate(today) ?? "",
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
    reservations(
      state: $state
      beginDate: $beginDate
      onlyWithHandlingPermission: true
    ) {
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
