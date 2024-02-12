import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { useQuery } from "@apollo/client";
import { useSession } from "@/hooks/auth";
import { Query, QueryReservationsArgs } from "common/types/gql-types";
import { HANDLING_COUNT_QUERY } from "../common/queries";

const useHandling = () => {
  const { isAuthenticated } = useSession();

  const today = useMemo(() => startOfDay(new Date()), []);
  const { data, refetch } = useQuery<Query, QueryReservationsArgs>(
    HANDLING_COUNT_QUERY,
    {
      skip: !isAuthenticated,
      variables: {
        begin: today.toISOString(),
      },
    }
  );

  const handlingCount: number = data?.reservations?.edges?.length ?? 0;
  const unitCount: number = data?.units?.totalCount ?? 0;
  const hasOwnUnits: boolean = unitCount > 0;

  return { handlingCount, hasOwnUnits, refetch };
};

export default useHandling;
