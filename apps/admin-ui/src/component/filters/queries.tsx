import { gql } from "@apollo/client";

export const RESERVATION_UNIT_TYPES_QUERY = gql`
  query ReservationUnitTypesFilter($offset: Int, $first: Int) {
    reservationUnitTypes(offset: $offset, first: $first) {
      edges {
        node {
          pk
          nameFi
        }
      }
      totalCount
    }
  }
`;

export const RESERVATION_UNITS_QUERY = gql`
  query ReservationUnitsFilter($offset: Int, $unit: [Int], $count: Int) {
    reservationUnits(
      offset: $offset
      onlyWithPermission: true
      unit: $unit
      orderBy: "nameFi"
      first: $count
    ) {
      edges {
        node {
          nameFi
          pk
        }
      }
      totalCount
    }
  }
`;
