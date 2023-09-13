import { gql } from "@apollo/client";

export const APPLICATIONS = gql`
  query Applications($user: ID, $status: [String]) {
    applications(user: $user, status: $status) {
      edges {
        node {
          pk
          applicationRound {
            pk
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
