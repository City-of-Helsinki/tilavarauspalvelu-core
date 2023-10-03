import { gql } from "@apollo/client";
import { APPLICATION_ROUND_FRAGMENT } from "./applicationRound";

export const APPLICATIONS = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query Applications($user: ID, $status: [String]) {
    applications(user: $user, status: $status) {
      edges {
        node {
          pk
          applicationRound {
            ...ApplicationRoundFields
          }
          applicantName
          status
          applicantType
          contactPerson {
            id
            firstName
            lastName
          }
          organisation {
            id
            name
          }
          lastModifiedDate
        }
      }
    }
  }
`;
