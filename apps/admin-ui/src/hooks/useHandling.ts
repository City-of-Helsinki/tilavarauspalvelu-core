import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { useSession } from "./useSession";
import { useHandlingDataQuery } from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { ReservationStateChoice } from "common/gql/gql-types";
import { gql } from "@apollo/client";

export function useHandling() {
  const { isAuthenticated } = useSession();

  const today = useMemo(() => startOfDay(new Date()), []);
  const { data, previousData, refetch } = useHandlingDataQuery({
    skip: !isAuthenticated,
    variables: {
      beginDate: toApiDate(today) ?? "",
      state: ReservationStateChoice.RequiresHandling,
    },
  });

  const d = data ?? previousData;
  const handlingCount: number = d?.reservations?.totalCount ?? 0;
  const unitCount: number = d?.allUnits?.length ?? 0;
  const hasOwnUnits: boolean = unitCount > 0;

  return { handlingCount, hasOwnUnits, refetch };
}

export const HANDLING_COUNT_QUERY = gql`
  query HandlingData(
    # Filter
    $beginDate: Date!
    $state: [ReservationStateChoice!]!
  ) {
    reservations(filter: { state: $state, beginDate: $beginDate, onlyWithHandlingPermission: true }) {
      edges {
        node {
          id
          pk
        }
      }
      totalCount
    }
    allUnits(filter: { onlyWithPermission: true }) {
      id
    }
  }
`;
