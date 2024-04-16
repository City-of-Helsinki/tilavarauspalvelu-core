import { gql } from "@apollo/client";

export const CREATE_RECURRING_RESERVATION = gql`
  mutation createRecurringReservation(
    $input: RecurringReservationCreateMutationInput!
  ) {
    createRecurringReservation(input: $input) {
      pk
    }
  }
`;

// TODO there is multiples of these fragments (for each Calendar), should be unified
const RESERVATIONS_IN_INTERVAL_FRAGMENT = gql`
  fragment ReservationsInInterval on ReservationNode {
    begin
    end
    bufferTimeBefore
    bufferTimeAfter
    type
    affectedReservationUnits
  }
`;

// TODO is reservationSet needed? or is affectingReservations enough?
// TODO this query would not be needed if the Calendar query would be passed to the useCheckCollisions
export const GET_RESERVATIONS_IN_INTERVAL = gql`
  ${RESERVATIONS_IN_INTERVAL_FRAGMENT}
  query ReservationTimesInReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [String]
  ) {
    reservationUnit(id: $id) {
      reservationSet(beginDate: $beginDate, endDate: $endDate, state: $state) {
        ...ReservationsInInterval
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...ReservationsInInterval
    }
  }
`;
