import { gql } from "@apollo/client";

/* minimal query for allocation page to populate the unit filter and reservation-units tabs
 * only needs to be done once when landing on the page
 * filtered queries only include the reservation-units that match the filters
 */
export const ALLOCATION_UNFILTERED_QUERY = gql`
  query Applications(
    $applicationRound: Int!
    $status: [ApplicationStatusChoice]!
  ) {
    applications(applicationRound: $applicationRound, status: $status) {
      edges {
        node {
          applicationRound {
            nameFi
            status
            reservationUnits {
              pk
              nameFi
              unit {
                pk
                nameFi
              }
            }
          }
        }
      }
    }
  }
`;

// Query the count of the application events for that specific unit + reservationUnit
export const ALL_EVENTS_PER_UNIT_QUERY = gql`
  query AllApplicationEvents(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $unit: [Int]!
    $reservationUnit: [Int]!
  ) {
    applicationEvents(
      applicationRound: $applicationRound
      reservationUnit: $reservationUnit
      unit: $unit
      applicationStatus: $applicationStatus
    ) {
      edges {
        node {
          eventReservationUnits {
            reservationUnit {
              pk
              nameFi
            }
          }
        }
      }
    }
  }
`;

export const DECLINE_APPLICATION_EVENT_SCHEDULE = gql`
  mutation ($input: ApplicationEventScheduleDeclineMutationInput!) {
    declineApplicationEventSchedule(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const APPROVE_APPLICATION_EVENT_SCHEDULE = gql`
  mutation ($input: ApplicationEventScheduleApproveMutationInput!) {
    approveApplicationEventSchedule(input: $input) {
      pk
      allocatedReservationUnit
      allocatedDay
      allocatedBegin
      allocatedEnd
      errors {
        field
        messages
      }
    }
  }
`;

export const RESET_APPLICATION_EVENT_SCHEDULE = gql`
  mutation ($input: ApplicationEventScheduleResetMutationInput!) {
    resetApplicationEventSchedule(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;
