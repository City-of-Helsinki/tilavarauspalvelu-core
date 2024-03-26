import { gql } from "@apollo/client";
import { RESERVATIONUNIT_RESERVATIONS_FRAGMENT } from "../reservations/fragments";

export const RECURRING_RESERVATION_UNIT_QUERY = gql`
  query RecurringReservationUnit($id: ID!) {
    unit(id: $id) {
      nameFi
      pk
      reservationunitSet {
        pk
        nameFi
        reservationStartInterval
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;

export const RESERVATIONS_BY_RESERVATIONUNITS = gql`
  ${RESERVATIONUNIT_RESERVATIONS_FRAGMENT}
  query ReservationUnitReservations(
    $id: ID!
    $state: [String]
    $beginDate: Date
    $endDate: Date
  ) {
    reservationUnit(id: $id) {
      pk
      ...ReservationUnitReservations
    }
  }
`;
