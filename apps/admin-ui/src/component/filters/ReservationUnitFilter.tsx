import { useReservationUnitsFilterParamsQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";

export function useReservationUnitOptions() {
  // TODO this request is rerun whenever the selection changes (it'll return 0 every time)
  const { data, loading } = useReservationUnitsFilterParamsQuery({
    // breaks the cache (testing removal)
    // fetchPolicy: "no-cache",
  });

  const resUnits = filterNonNullable(
    data?.reservationUnits?.edges.map((x) => x?.node)
  );

  const options = resUnits.map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "",
    value: reservationUnit?.pk ?? 0,
  }));

  return { options, loading };
}
