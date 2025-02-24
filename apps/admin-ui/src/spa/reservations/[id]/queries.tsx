import { gql } from "@apollo/client";

export const APPROVE_RESERVATION = gql`
  mutation ApproveReservation($input: ReservationApproveMutationInput!) {
    approveReservation(input: $input) {
      pk
      state
    }
  }
`;

export const REQUIRE_HANDLING_RESERVATION = gql`
  mutation RequireHandling($input: ReservationRequiresHandlingMutationInput!) {
    requireHandlingForReservation(input: $input) {
      pk
      state
    }
  }
`;

export const CHANGE_RESERVATION_ACCESS_CODE = gql`
  mutation ChangeReservationAccessCode(
    $input: ReservationStaffChangeAccessCodeMutationInput!
  ) {
    staffChangeReservationAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;

export const REPAIR_RESERVATION_ACCESS_CODE = gql`
  mutation RepairReservationAccessCode(
    $input: ReservationStaffRepairAccessCodeMutationInput!
  ) {
    staffRepairReservationAccessCode(input: $input) {
      pk
      accessCodeIsActive
      accessCodeGeneratedAt
    }
  }
`;
