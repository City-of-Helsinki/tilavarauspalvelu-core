import { gql } from "@apollo/client";
import { APPLICATION_FRAGMENT } from "common/src/queries/application";

/// FIXME this causes a depth of 22 in the database query (fails because of it)
/// needs to increase the MAX_COMPLEXITY in backend for this to work
/// so don't allow it to be merged till it's either simplified or backend has higher endpoint complexity limit
// TODO replace with relay query (requires backend changes)
export const APPLICATION_ADMIN_QUERY = gql`
  ${APPLICATION_FRAGMENT}
  query getApplication($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      workingMemo
    }
  }
`;
