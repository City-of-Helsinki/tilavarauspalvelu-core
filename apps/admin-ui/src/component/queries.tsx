import { gql } from "@apollo/client";

export const UPDATE_RESERVATION_WORKING_MEMO = gql`
  mutation updateReservationWorkingMemo($pk: Int!, $workingMemo: String!) {
    updateReservationWorkingMemo(
      input: { pk: $pk, workingMemo: $workingMemo }
    ) {
      pk
      workingMemo
    }
  }
`;

export const UPDATE_APPLICATION_WORKING_MEMO = gql`
  mutation updateApplicationWorkingMemo($pk: Int!, $workingMemo: String!) {
    updateApplication(input: { pk: $pk, workingMemo: $workingMemo }) {
      pk
      workingMemo
    }
  }
`;
