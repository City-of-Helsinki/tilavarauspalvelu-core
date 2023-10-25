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

export const CREATE_APPLICATION_MUTATION = gql`
  mutation ($input: ApplicationCreateMutationInput!) {
    createApplication(input: $input) {
      errors {
        messages
      }
    }
  }
`;

export const UPDATE_APPLICATION_MUTATION = gql`
  mutation ($input: ApplicationUpdateMutationInput!) {
    updateApplication(input: $input) {
      errors {
        messages
      }
    }
  }
`;
