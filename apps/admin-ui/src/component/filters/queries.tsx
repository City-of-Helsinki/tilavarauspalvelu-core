import { gql } from "@apollo/client";

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

export const RESERVATION_UNITS_FILTER_PARAMS_QUERY = gql`
  query ReservationUnitsFilterParams(
    $offset: Int
    $unit: [Int]
    $first: Int
    $orderBy: [ReservationUnitOrderingChoices]
  ) {
    reservationUnits(
      offset: $offset
      onlyWithPermission: true
      unit: $unit
      orderBy: $orderBy
      first: $first
    ) {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
      totalCount
    }
  }
`;
