import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { useReservationUnitTypesFilterQuery } from "@gql/gql-types";

export const RESERVATION_UNIT_TYPES_QUERY = gql`
  query ReservationUnitTypesFilter($offset: Int, $first: Int) {
    reservationUnitTypes(offset: $offset, first: $first) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
      totalCount
    }
  }
`;

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
