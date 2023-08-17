import { useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";

import { Query, QueryReservationsArgs } from "common/types/gql-types";
import { HANDLING_COUNT_QUERY } from "../common/queries";

export const useHandling = () => {
  const { status } = useSession();

  const { data, refetch } = useQuery<Query, QueryReservationsArgs>(
    HANDLING_COUNT_QUERY,
    {
      skip: status !== "authenticated",
      fetchPolicy: "no-cache",
    }
  );

  const handlingCount: number = data?.reservations?.edges?.length ?? 0;
  const unitCount: number = data?.units?.totalCount ?? 0;
  const hasOwnUnits: boolean = unitCount > 0;

  return { handlingCount, hasOwnUnits, refetch };
};
