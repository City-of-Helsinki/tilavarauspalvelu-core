import { gql } from "@apollo/client";

const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundFragment on ApplicationRoundNode {
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
  }
`;

export const APPLICATION_ROUNDS_QUERY = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query applicationRounds {
    applicationRounds {
      edges {
        node {
          ...ApplicationRoundFragment
          reservationPeriodBegin
          reservationPeriodEnd
          applicationsCount
          reservationUnitCount
          statusTimestamp
          serviceSector {
            pk
            nameFi
          }
        }
      }
    }
  }
`;

export const APPLICATION_ROUD_QUERY = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRoundCriteria($pk: [Int]!) {
    applicationRounds(pk: $pk) {
      edges {
        node {
          ...ApplicationRoundFragment
          applicationsCount
          reservationUnits {
            pk
          }
        }
      }
    }
  }
`;

// Separate minimal query to find all possible values for filters
export const MINIMAL_APPLICATION_QUERY = gql`
  query Applications(
    $applicationRound: Int!
    $status: [ApplicationStatusChoice]!
  ) {
    applications(applicationRound: $applicationRound, status: $status) {
      edges {
        node {
          applicationRound {
            nameFi
          }
          applicationEvents {
            eventReservationUnits {
              reservationUnit {
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

// TODO priority vs preferredOrder, preferredOrder is the selected reservationUnit order, priority is the primary / secondary
// TODO check if we can remove some of the fields (and move them to the filter query, ex unit / reservationUnit)
export const APPLICATION_EVENTS_FOR_ALLOCATION = gql`
  query getApplicationEvents(
    $applicationRound: Int
    $applicationStatus: [ApplicationStatusChoice]
    $unit: [Int]
    $preferredOrder: [Int]
    $textSearch: String
    $name_Istartswith: String
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
      name_Istartswith: $name_Istartswith
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
