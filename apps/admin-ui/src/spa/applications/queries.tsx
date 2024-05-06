import { gql } from "@apollo/client";
import { APPLICATION_ADMIN_FRAGMENT } from "common/src/queries/application";

/// NOTE Requires higher backend optimizer complexity limit (21 works)
export const APPLICATION_ADMIN_QUERY = gql`
  ${APPLICATION_ADMIN_FRAGMENT}
  query ApplicationAdmin($id: ID!) {
    application(id: $id) {
      ...ApplicationAdminFragment
      workingMemo
    }
  }
`;

export const REJECT_ALL_SECTION_OPTIONS = gql`
  mutation rejectAllSectionOptions(
    $input: RejectAllSectionOptionsMutationInput!
  ) {
    rejectAllSectionOptions(input: $input) {
      pk
    }
  }
`;

export const RESTORE_ALL_SECTION_OPTIONS = gql`
  mutation restoreAllSectionOptions(
    $input: RestoreAllSectionOptionsMutationInput!
  ) {
    restoreAllSectionOptions(input: $input) {
      pk
    }
  }
`;
