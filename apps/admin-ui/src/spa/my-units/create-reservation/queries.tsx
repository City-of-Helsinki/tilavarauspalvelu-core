import { gql } from "@apollo/client";

export const CREATE_STAFF_RESERVATION = gql`
  mutation CreateStaffReservation(
    $input: ReservationStaffCreateMutationInput!
  ) {
    createStaffReservation(input: $input) {
      pk
    }
  }
`;
