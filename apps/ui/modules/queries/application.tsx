import { gql } from "@apollo/client";

// NOTE because this doesn't have pagination we use orderBy for development purposes only
// if you create new application it's the first one in the list
export const APPLICATIONS = gql`
  query Applications(
    $user: Int!
    $status: [ApplicationStatusChoice]!
    $orderBy: [ApplicationOrderingChoices]!
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
          ...ApplicationName
          lastModifiedDate
        }
      }
    }
  }
`;

// Commmon query for all application pages (except view)
export const APPLICATION_QUERY = gql`
  query Application($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      applicationRound {
        id
        sentDate
        notesWhenApplyingFi
        notesWhenApplyingEn
        notesWhenApplyingSv
        termsOfUse {
          id
          ...TermsOfUseFields
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
