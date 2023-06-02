import { gql } from "@apollo/client";

export const CREATE_STAFF_RESERVATION = gql`
  mutation createStaffReservation(
    $input: ReservationStaffCreateMutationInput!
  ) {
    createStaffReservation(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;
