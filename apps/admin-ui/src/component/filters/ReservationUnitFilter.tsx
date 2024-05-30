import { useEffect } from "react";
import { useReservationUnitsFilterParamsQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";

export function useReservationUnitOptions() {
  const { data, loading, fetchMore } = useReservationUnitsFilterParamsQuery();

  // auto fetch more (there is no limit, expect number of them would be a few hundred, but in theory this might cause problems)
  // NOTE have to useEffect, onComplete stops at 200 items
  useEffect(() => {
    const { pageInfo } = data?.reservationUnits ?? {};
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          after: pageInfo.endCursor,
        },
      });
    }
  }, [data, fetchMore]);

  const resUnits = filterNonNullable(
    data?.reservationUnits?.edges.map((x) => x?.node)
  );

  const options = resUnits.map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "",
    value: reservationUnit?.pk ?? 0,
  }));

  return { options, loading };
}
