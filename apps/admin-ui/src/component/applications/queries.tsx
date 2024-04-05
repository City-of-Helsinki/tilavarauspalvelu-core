import { gql } from "@apollo/client";
import { APPLICATION_FRAGMENT } from "common/src/queries/application";

/// NOTE Requires higher backend optimizer complexity limit (21 works)
export const APPLICATION_ADMIN_QUERY = gql`
  ${APPLICATION_FRAGMENT}
  query ApplicationAdmin($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      workingMemo
    }
  }
`;
