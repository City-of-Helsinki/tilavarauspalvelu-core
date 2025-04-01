import { gql } from "@apollo/client";

export const APPLICATIONS_QUERY = gql`
  query Applications(
    $applicationRound: Int!
    $unit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $status: [ApplicationStatusChoice]!
    $textSearch: String
    $orderBy: [ApplicationOrderingChoices]
    $first: Int
    $after: String
  ) {
    applications(
      applicationRound: $applicationRound
      unit: $unit
      applicantType: $applicantType
      status: $status
      textSearch: $textSearch
      orderBy: $orderBy
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          pk
          status
          ...ApplicationName
          applicationSections {
            id
            pk
            name
            ...ApplicationSectionDuration
            reservationUnitOptions {
              id
              preferredOrder
              reservationUnit {
                id
                unit {
                  id
                  pk
                  nameFi
                }
              }
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

/// NOTE Requires higher backend optimizer complexity limit (14 works, lower doesn't)
/// NOTE might have some cache issues (because it collides with the other sections query)
/// TODO rename (there is no Events anymore)
/// TODO see if we can remove some of the fields (like reservationUnitOptions)
export const APPLICATIONS_EVENTS_QUERY = gql`
  query ApplicationSections(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $status: [ApplicationSectionStatusChoice]
    $unit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Priority]
    $purpose: [Int]
    $reservationUnit: [Int]
    $ageGroup: [Int]
    $homeCity: [Int]
    $includePreferredOrder10OrHigher: Boolean
    $orderBy: [ApplicationSectionOrderingChoices]
    $first: Int
    $after: String
  ) {
    applicationSections(
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      status: $status
      unit: $unit
      applicantType: $applicantType
      preferredOrder: $preferredOrder
      textSearch: $textSearch
      priority: $priority
      purpose: $purpose
      reservationUnit: $reservationUnit
      ageGroup: $ageGroup
      homeCity: $homeCity
      includePreferredOrder10OrHigher: $includePreferredOrder10OrHigher
      orderBy: $orderBy
      first: $first
      after: $after
    ) {
      edges {
        node {
          ...ApplicationSectionFields
          allocations
          reservationUnitOptions {
            id
            allocatedTimeSlots {
              id
              pk
              dayOfTheWeek
              beginTime
              endTime
              reservationUnitOption {
                id
                applicationSection {
                  id
                  pk
                }
              }
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const ALLOCATED_TIME_SLOTS_QUERY = gql`
  query AllocatedTimeSlots(
    $applicationRound: Int!
    $allocatedUnit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $applicationSectionStatus: [ApplicationSectionStatusChoice]
    $allocatedReservationUnit: [Int]
    $dayOfTheWeek: [Weekday]
    $textSearch: String
    $accessCodeState: [AccessCodeState]
    $orderBy: [AllocatedTimeSlotOrderingChoices]
    $after: String
    $first: Int
  ) {
    allocatedTimeSlots(
      after: $after
      first: $first
      applicationRound: $applicationRound
      allocatedUnit: $allocatedUnit
      applicantType: $applicantType
      applicationSectionStatus: $applicationSectionStatus
      allocatedReservationUnit: $allocatedReservationUnit
      accessCodeState: $accessCodeState
      dayOfTheWeek: $dayOfTheWeek
      textSearch: $textSearch
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          pk
          dayOfTheWeek
          endTime
          beginTime
          recurringReservation {
            id
            pk
            shouldHaveActiveAccessCode
            isAccessCodeIsActiveCorrect
            reservations {
              id
              pk
            }
          }
          reservationUnitOption {
            id
            rejected
            locked
            preferredOrder
            applicationSection {
              id
              pk
              name
              reservationsEndDate
              reservationsBeginDate
              reservationMinDuration
              reservationMaxDuration
              application {
                pk
                id
                ...ApplicationName
              }
            }
            reservationUnit {
              id
              nameFi
              unit {
                id
                nameFi
              }
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
