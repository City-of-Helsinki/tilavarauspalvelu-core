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
  query reservationUnits($unit: [ID]) {
    reservationUnits(onlyWithPermission: true, unit: $unit) {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
  }
`;
