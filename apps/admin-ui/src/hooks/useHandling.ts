import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { useSession } from "@/hooks/auth";
import { useHandlingDataQuery } from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";

const useHandling = () => {
  const { isAuthenticated } = useSession();

  const today = useMemo(() => startOfDay(new Date()), []);
  const { data, refetch } = useHandlingDataQuery({
    skip: !isAuthenticated,
    variables: {
      beginDate: toApiDate(today) ?? "",
    },
  });

  const handlingCount: number = data?.reservations?.edges?.length ?? 0;
  const unitCount: number = data?.units?.totalCount ?? 0;
  const hasOwnUnits: boolean = unitCount > 0;

  return { handlingCount, hasOwnUnits, refetch };
};

export default useHandling;
