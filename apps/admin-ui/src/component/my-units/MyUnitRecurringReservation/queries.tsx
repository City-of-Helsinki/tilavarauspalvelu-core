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

export const GET_RESERVATIONS_IN_INTERVAL = gql`
  query ReservationTimesInReservationUnit(
    $id: ID!
    $beginDate: Date
    $endDate: Date
    $state: [String]
  ) {
    reservationUnit(id: $id) {
      reservationSet(beginDate: $beginDate, endDate: $endDate, state: $state) {
        begin
        end
        bufferTimeBefore
        bufferTimeAfter
        type
      }
    }
  }
`;
