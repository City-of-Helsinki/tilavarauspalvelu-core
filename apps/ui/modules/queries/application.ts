import { gql } from "@apollo/client";
import { APPLICATION_ROUND_FRAGMENT } from "./applicationRound";

export const APPLICATIONS = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query Applications($applicant: Int, $status: [ApplicationStatusChoice]) {
    applications(applicant: $applicant, status: $status) {
      edges {
        node {
          pk
          applicationRound {
            ...ApplicationRoundFields
          }
          applicant {
            name
          }
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
      pk
      errors {
        messages
        field
      }
    }
  }
`;

export const UPDATE_APPLICATION_MUTATION = gql`
  mutation ($input: ApplicationUpdateMutationInput!) {
    updateApplication(input: $input) {
      pk
      errors {
        messages
        field
      }
    }
  }
`;

export const SEND_APPLICATION_MUTATION = gql`
  mutation ($input: ApplicationSendMutationInput!) {
    sendApplication(input: $input) {
      pk
      errors {
        messages
        field
      }
    }
  }
`;

export const CANCEL_APPLICATION_MUTATION = gql`
  mutation ($input: ApplicationCancelMutationInput!) {
    cancelApplication(input: $input) {
      pk
      errors {
        messages
        field
      }
    }
  }
`;
