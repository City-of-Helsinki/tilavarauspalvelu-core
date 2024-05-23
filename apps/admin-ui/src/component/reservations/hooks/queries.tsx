import { gql } from "@apollo/client";

export const UPDATE_STAFF_RESERVATION = gql`
  mutation UpdateStaffReservation(
    $input: ReservationStaffModifyMutationInput!
    $workingMemo: ReservationWorkingMemoMutationInput!
  ) {
    staffReservationModify(input: $input) {
      pk
    }
    updateReservationWorkingMemo(input: $workingMemo) {
      workingMemo
    }
  }
`;

export const UPDATE_STAFF_RECURRING_RESERVATION = gql`
  mutation UpdateRecurringReservation(
    $input: RecurringReservationUpdateMutationInput!
  ) {
    updateRecurringReservation(input: $input) {
      pk
    }
  }
`;
