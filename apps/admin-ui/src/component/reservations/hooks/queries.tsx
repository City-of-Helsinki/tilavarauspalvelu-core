import { gql } from "@apollo/client";

export const UPDATE_STAFF_RESERVATION = gql`
  mutation staffReservationModify(
    $input: ReservationStaffModifyMutationInput!
    $workingMemo: ReservationWorkingMemoMutationInput!
  ) {
    staffReservationModify(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
    updateReservationWorkingMemo(input: $workingMemo) {
      workingMemo
      errors {
        field
        messages
      }
    }
  }
`;

export const UPDATE_STAFF_RECURRING_RESERVATION = gql`
  mutation updateRecurringReservation(
    $input: RecurringReservationUpdateMutationInput!
  ) {
    updateRecurringReservation(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;
