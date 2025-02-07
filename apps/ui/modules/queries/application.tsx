import { gql } from "@apollo/client";

// NOTE for some reason codegen doesn't run on component files (at least some of them)

export const APPLICATION_SECTION_RESERVATION_FRAGMENT = gql`
  fragment ApplicationSectionReservation on ApplicationSectionNode {
    id
    pk
    name
    reservationUnitOptions {
      id
      allocatedTimeSlots {
        id
        dayOfTheWeek
        beginTime
        endTime
        recurringReservation {
          id
          pk
          beginTime
          endTime
          weekdays
          reservationUnit {
            id
            pk
            nameFi
            nameEn
            nameSv
            reservationConfirmedInstructionsFi
            reservationConfirmedInstructionsEn
            reservationConfirmedInstructionsSv
            unit {
              id
              nameFi
              nameEn
              nameSv
            }
          }
          rejectedOccurrences {
            id
            beginDatetime
            endDatetime
          }
          reservations(orderBy: [beginAsc], beginDate: $beginDate) {
            id
            pk
            end
            state
            ...CanUserCancelReservation
          }
        }
      }
    }
  }
`;

// client side query, for now take all the data needed for this Tab
// client side because the SSR query is too complex already
// this allows faster iteration and splitting the query if needed (based on open Accordions)
// we can cache data on client side (when user opens Accordions)
export const APPLICATION_RESERVATIONS_QUERY = gql`
  query ApplicationReservations($id: ID!, $beginDate: Date!) {
    application(id: $id) {
      id
      pk
      applicationSections {
        ...ApplicationSectionReservation
      }
    }
  }
`;

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
          sentDate
        }
      }
    }
  }
`;

export const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundForApplication on ApplicationRoundNode {
    id
    pk
    nameFi
    nameSv
    nameEn
    reservationUnits {
      id
      pk
      nameFi
      nameSv
      nameEn
      minPersons
      maxPersons
      images {
        ...Image
      }
      unit {
        id
        pk
        nameFi
        nameSv
        nameEn
      }
    }
    applicationPeriodBegin
    applicationPeriodEnd
    reservationPeriodBegin
    reservationPeriodEnd
    status
    applicationsCount
    reservationUnitCount
    statusTimestamp
  }
`;

export const APPLICATION_FRAGMENT = gql`
  fragment ApplicationCommon on ApplicationNode {
    id
    pk
    status
    lastModifiedDate
    ...Applicant
    applicationRound {
      ...ApplicationRoundForApplication
      sentDate
      termsOfUse {
        id
        ...TermsOfUseFields
      }
    }
    applicationSections {
      ...ApplicationSectionUI
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
        notesWhenApplyingFi
        notesWhenApplyingEn
        notesWhenApplyingSv
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

export const CANCEL_APPLICATION_SECTION_MUTATION = gql`
  mutation CancelApplicationSection(
    $input: ApplicationSectionReservationCancellationMutationInput!
  ) {
    cancelAllApplicationSectionReservations(input: $input) {
      future
      cancelled
    }
  }
`;
