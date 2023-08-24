import { useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";

import { Query } from "common/types/gql-types";
import { HANDLING_COUNT_QUERY } from "../common/queries";

const useHandling = () => {
  const { status } = useSession();

  const { data, refetch } = useQuery<Query>(HANDLING_COUNT_QUERY, {
    skip: status !== "authenticated",
  });

  const handlingCount: number = data?.reservations?.edges?.length ?? 0;
  const unitCount: number = data?.units?.totalCount ?? 0;
  const hasOwnUnits: boolean = unitCount > 0;

  return { handlingCount, hasOwnUnits, refetch };
};

export default useHandling;
