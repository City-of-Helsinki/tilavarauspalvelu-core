import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import {
  ReservationUnitTypeOrderingChoices,
  useReservationUnitTypesFilterQuery,
} from "@gql/gql-types";

export const RESERVATION_UNIT_TYPES_QUERY = gql`
  query ReservationUnitTypesFilter(
    $after: String
    $orderBy: [ReservationUnitTypeOrderingChoices]
  ) {
    reservationUnitTypes(after: $after, orderBy: $orderBy) {
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
  const { data, loading } = useReservationUnitTypesFilterQuery({
    variables: {
      orderBy: ReservationUnitTypeOrderingChoices.NameFiAsc,
    },
  });

  const qd = data?.reservationUnitTypes;
  const types = filterNonNullable(qd?.edges.map((x) => x?.node));

  const options = types.map((type) => ({
    label: type?.nameFi ?? "",
    value: type?.pk ?? 0,
  }));

  return { options, loading };
}
