import { gql } from "@apollo/client";

export const APPROVE_RESERVATION = gql`
  mutation approveReservation($input: ReservationApproveMutationInput!) {
    approveReservation(input: $input) {
      pk
      state
    }
  }
`;

export const DENY_RESERVATION = gql`
  mutation denyReservation($input: ReservationDenyMutationInput!) {
    denyReservation(input: $input) {
      pk
      state
    }
  }
`;

export const REFUND_RESERVATION = gql`
  mutation refundReservation($input: ReservationRefundMutationInput!) {
    refundReservation(input: $input) {
      pk
    }
  }
`;

export const REQUIRE_HANDLING_RESERVATION = gql`
  mutation requireHandling($input: ReservationRequiresHandlingMutationInput!) {
    requireHandlingForReservation(input: $input) {
      pk
      state
    }
  }
`;

export const RESERVATION_DENY_REASONS = gql`
  query ReservationDenyReasons {
    reservationDenyReasons {
      edges {
        node {
          id
          pk
          reasonFi
        }
      }
    }
  }
`;
