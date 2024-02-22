import { gql } from "@apollo/client";
import {
  RESERVATIONUNIT_RESERVATIONS_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
} from "../../reservations/fragments";

export const OPTIONS_QUERY = gql`
  query options {
    reservationPurposes {
      edges {
        node {
          pk
          nameFi
        }
      }
    }
    ageGroups {
      edges {
        node {
          pk
          minimum
          maximum
        }
      }
    }
    cities {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
  }
`;

// NOTE old pk: ID type
export const UNIT_QUERY = gql`
  query units($pk: [ID]) {
    units(pk: $pk, onlyWithPermission: true) {
      edges {
        node {
          location {
            addressStreetFi
            addressZip
            addressCityFi
          }
          nameFi
          pk
          serviceSectors {
            nameFi
          }
          reservationUnits {
            pk
            spaces {
              pk
            }
          }
        }
      }
    }
  }
`;

export const RESERVATION_UNITS_BY_UNIT = gql`
  ${RESERVATIONUNIT_RESERVATIONS_FRAGMENT}
  query reservationUnitsByUnit(
    $unit: [Int]
    $from: Date
    $to: Date
    $includeWithSameComponents: Boolean
  ) {
    reservationUnits(unit: $unit, orderBy: "nameFi") {
      edges {
        node {
          pk
          nameFi
          spaces {
            pk
          }
          reservationUnitType {
            pk
          }
          bufferTimeBefore
          bufferTimeAfter
          isDraft
          authentication
          ...ReservationUnitReservations
        }
      }
    }
  }
`;

export const RESERVATION_UNIT_QUERY = gql`
  ${RESERVATION_UNIT_FRAGMENT}
  query reservationUnits($pk: [Int]) {
    reservationUnits(onlyWithPermission: true, pk: $pk) {
      edges {
        node {
          ...ReservationUnit
        }
      }
    }
  }
`;
