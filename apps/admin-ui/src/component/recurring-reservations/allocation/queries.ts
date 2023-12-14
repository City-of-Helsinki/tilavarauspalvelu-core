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

export const APPLICATION_EVENTS_FOR_ALLOCATION = gql`
  query getApplicationEvents(
    $applicationRound: Int
    $applicationStatus: [ApplicationStatusChoice]
    $unit: [Int]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Int]
    $purpose: [Int]
    $reservationUnit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $ageGroup: [Int]
    $homeCity: [Int]
    $includePreferredOrder10OrHigher: Boolean
  ) {
    applicationEvents(
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      unit: $unit
      textSearch: $textSearch
      preferredOrder: $preferredOrder
      priority: $priority
      purpose: $purpose
      reservationUnit: $reservationUnit
      applicantType: $applicantType
      ageGroup: $ageGroup
      homeCity: $homeCity
      includePreferredOrder10OrHigher: $includePreferredOrder10OrHigher
    ) {
      edges {
        node {
          pk
          eventsPerWeek
          minDuration
          maxDuration
          eventsPerWeek
          name
          status
          ageGroup {
            minimum
            maximum
          }
          applicationEventSchedules {
            pk
            priority
            day
            begin
            end
            allocatedReservationUnit {
              pk
            }
            allocatedDay
            allocatedBegin
            allocatedEnd
          }
          eventReservationUnits {
            preferredOrder
            reservationUnit {
              pk
              nameFi
              unit {
                pk
                nameFi
              }
            }
          }
          application {
            pk
            status
            applicant {
              name
            }
            applicantType
            contactPerson {
              firstName
              lastName
            }
            organisation {
              name
              organisationType
            }
          }
        }
      }
    }
  }
`;

export const DECLINE_APPLICATION_EVENT_SCHEDULE = gql`
  mutation ($input: ApplicationEventDeclineMutationInput!) {
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
