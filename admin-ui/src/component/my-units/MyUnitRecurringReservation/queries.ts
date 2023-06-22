import { gql } from "@apollo/client";

export const CREATE_RECURRING_RESERVATION = gql`
  mutation createRecurringReservation(
    $input: RecurringReservationCreateMutationInput!
  ) {
    createRecurringReservation(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const GET_RESERVATIONS_IN_INTERVAL = gql`
  query ReservationTimesInReservationUnit($pk: Int, $from: Date, $to: Date) {
    reservationUnitByPk(pk: $pk) {
      reservations(
        from: $from
        to: $to
        includeWithSameComponents: true
        state: [
          "CONFIRMED"
          "CREATED"
          "REQUIRES_HANDLING"
          "WAITING_FOR_PAYMENT"
          "CONFIRMED"
        ]
      ) {
        begin
        end
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;
