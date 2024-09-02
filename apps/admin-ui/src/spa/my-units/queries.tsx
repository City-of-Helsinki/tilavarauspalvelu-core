import { gql } from "@apollo/client";
import { RESERVATIONUNIT_RESERVATIONS_FRAGMENT } from "@/common/fragments";

export const RECURRING_RESERVATION_UNIT_QUERY = gql`
  query RecurringReservationUnit($id: ID!) {
    unit(id: $id) {
      id
      nameFi
      pk
      reservationunitSet {
        id
        pk
        nameFi
        reservationStartInterval
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;

// TODO the fragments that this uses should be combined with the other tab page (my-units)
// This is only used in the ReservationUnitCalendar component.
export const RESERVATION_UNIT_CALENDAR_QUERY = gql`
  ${RESERVATIONUNIT_RESERVATIONS_FRAGMENT}
  query ReservationUnitCalendar(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice]
    $beginDate: Date
    $endDate: Date
  ) {
    reservationUnit(id: $id) {
      id
      pk
      reservationSet(state: $state, beginDate: $beginDate, endDate: $endDate) {
        ...ReservationUnitReservations
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...ReservationUnitReservations
    }
  }
`;
