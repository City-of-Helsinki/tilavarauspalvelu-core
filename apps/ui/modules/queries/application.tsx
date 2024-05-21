import { gql } from "@apollo/client";
import { APPLICATION_ROUND_FRAGMENT } from "./applicationRound";
import { APPLICANT_NAME_FRAGMENT } from "common/src/queries/application";
import { ApplicationOrderingChoices } from "@gql/gql-types";

// TODO this doesn't have pagination so the orderBy is for development purposes only
// in production the order isn't specified and pagination is not needed
// (there is never even close to 100 applications for single user)
// but in development we need to be able to see the latest applications.
export const APPLICATIONS = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  ${APPLICANT_NAME_FRAGMENT}
  query Applications(
    $user: Int!,
    $status: [ApplicationStatusChoice]!,
    $orderBy: [ApplicationOrderingChoices] = [${ApplicationOrderingChoices.PkDesc}]
  ) {
    applications(user: $user, status: $status, orderBy: $orderBy) {
      edges {
        node {
          id
          pk
          applicationRound {
            ...ApplicationRoundFields
          }
          user {
            id
            name
          }
          status
          ...ApplicationNameFragment
          lastModifiedDate
        }
      }
    }
  }
`;

export const CREATE_APPLICATION_MUTATION = gql`
  mutation CreateApplication($input: ApplicationCreateMutationInput!) {
    createApplication(input: $input) {
      pk
    }
  }
`;

export const UPDATE_APPLICATION_MUTATION = gql`
  mutation UpdateApplication($input: ApplicationUpdateMutationInput!) {
    updateApplication(input: $input) {
      pk
    }
  }
`;

export const SEND_APPLICATION_MUTATION = gql`
  mutation SendApplication($input: ApplicationSendMutationInput!) {
    sendApplication(input: $input) {
      pk
    }
  }
`;

export const CANCEL_APPLICATION_MUTATION = gql`
  mutation CancelApplication($input: ApplicationCancelMutationInput!) {
    cancelApplication(input: $input) {
      pk
    }
  }
`;
