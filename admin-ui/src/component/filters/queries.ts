import { gql } from "@apollo/client";

export const RESERVATION_UNIT_TYPES_QUERY = gql`
  query reservationUnitTypes {
    reservationUnitTypes {
      edges {
        node {
          pk
          nameFi
        }
      }
    }
  }
`;

export const RESERVATION_UNITS_QUERY = gql`
  query reservationUnits($offset: Int, $unit: [ID], $count: Int) {
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
