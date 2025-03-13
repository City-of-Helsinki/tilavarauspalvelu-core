import { gql } from "@apollo/client";

// includes all the form fields for an application funnel
// requires a lot of fields because we are doing full form validation for stepper / sending
export const APPLICATION_FORM_FRAGMENT = gql`
  fragment ApplicationForm on ApplicationNode {
    id
    pk
    status
    ...Applicant
    applicationRound {
      id
      ...ApplicationRoundForApplication
      notesWhenApplyingFi
      notesWhenApplyingEn
      notesWhenApplyingSv
    }
    applicationSections {
      ...ApplicationSectionUI
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
