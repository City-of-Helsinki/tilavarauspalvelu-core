import { gql } from "@apollo/client";
import { RESERVATIONUNIT_RESERVATIONS_FRAGMENT } from "../reservations/fragments";

export const RECURRING_RESERVATION_UNIT_QUERY = gql`
  query units($pk: [ID]) {
    units(pk: $pk, onlyWithPermission: true) {
      edges {
        node {
          nameFi
          pk
          reservationUnits {
            pk
            nameFi
            reservationStartInterval
            bufferTimeBefore
            bufferTimeAfter
          }
        }
      }
    }
  }
`;

export const RESERVATIONS_BY_RESERVATIONUNITS = gql`
  ${RESERVATIONUNIT_RESERVATIONS_FRAGMENT}
  query ReservationUnits(
    $pk: ID
    $from: Date
    $to: Date
    $includeWithSameComponents: Boolean
  ) {
    reservationUnits(pk: [$pk]) {
      edges {
        node {
          pk
          ...ReservationUnitReservations
        }
      }
    }
  }
`;
