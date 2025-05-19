import { gql } from "@apollo/client";

// includes all the form fields for an application funnel
// requires a lot of fields because we are doing full form validation for stepper / sending
export const APPLICATION_FORM_FRAGMENT = gql`
  fragment ApplicationForm on ApplicationNode {
    id
    pk
    status
    ...ApplicantFields
    applicationRound {
      id
      ...ApplicationRoundForApplication
      notesWhenApplyingFi
      notesWhenApplyingEn
      notesWhenApplyingSv
    }
    applicationSections {
      id
      pk
      name
      status
      reservationsEndDate
      reservationsBeginDate
      appliedReservationsPerWeek
      reservationMinDuration
      reservationMaxDuration
      ageGroup {
        id
        pk
        minimum
        maximum
      }
      numPersons
      reservationUnitOptions {
        id
        pk
        preferredOrder
        reservationUnit {
          id
          pk
        }
      }
      suitableTimeRanges {
        ...SuitableTime
      }
      purpose {
        id
        pk
        nameFi
        nameEn
        nameSv
      }
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
