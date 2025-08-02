import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { ReservationUnitTypeOrderSet, useReservationUnitTypesFilterQuery } from "@gql/gql-types";

export const RESERVATION_UNIT_TYPES_QUERY = gql`
  query ReservationUnitTypesFilter($orderBy: [ReservationUnitTypeOrderSet!]) {
    allReservationUnitTypes(orderBy: $orderBy) {
      id
      pk
      nameFi
    }
  }
`;

export function useReservationUnitTypes() {
  const { data, loading } = useReservationUnitTypesFilterQuery({
    variables: {
      orderBy: ReservationUnitTypeOrderSet.NameFiAsc,
    },
  });

  const options = filterNonNullable(data?.allReservationUnitTypes).map((type) => ({
    label: type?.nameFi ?? "",
    value: type?.pk ?? 0,
  }));

  return { options, loading };
}
