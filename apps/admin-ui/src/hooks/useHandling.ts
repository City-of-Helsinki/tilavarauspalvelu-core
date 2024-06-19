import { useMemo } from "react";
import { startOfDay } from "date-fns";
import { useSession } from "@/hooks/auth";
import { useHandlingDataQuery } from "@gql/gql-types";
import { toApiDate } from "common/src/common/util";
import { ReservationStateChoice } from "common/gql/gql-types";

const useHandling = () => {
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
  const unitCount: number = data?.units?.totalCount ?? 0;
  const hasOwnUnits: boolean = unitCount > 0;

  return { handlingCount, hasOwnUnits, refetch };
};

export default useHandling;
