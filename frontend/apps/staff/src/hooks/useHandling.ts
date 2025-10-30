import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { useSession } from "@/hooks";
import { useHandlingDataQuery, ReservationStateChoice } from "@gql/gql-types";
import { formatApiDate } from "ui/src/modules/date-utils";
import { gql } from "@apollo/client";

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
