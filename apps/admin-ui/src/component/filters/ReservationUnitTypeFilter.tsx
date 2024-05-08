import { useReservationUnitTypesFilterQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";

// TODO move
export function useReservationUnitTypes() {
  const { data, loading } = useReservationUnitTypesFilterQuery();

  const qd = data?.reservationUnitTypes;
  const types = filterNonNullable(qd?.edges.map((x) => x?.node));

  const options = types.map((type) => ({
    label: type?.nameFi ?? "",
    value: type?.pk ?? 0,
  }));

  return { options, loading };
}
