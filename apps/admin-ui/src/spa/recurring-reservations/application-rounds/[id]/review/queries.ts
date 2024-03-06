import { gql } from "@apollo/client";
import {
  APPLICANT_NAME_FRAGMENT,
  APPLICATION_DURATION_FRAGMENT,
  APPLICATION_SECTION_FRAGMENT,
} from "common/src/queries/application";

export const APPLICATIONS_QUERY = gql`
  ${APPLICANT_NAME_FRAGMENT}
  ${APPLICATION_DURATION_FRAGMENT}
  query getApplications(
    $applicationRound: Int!
    $unit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $status: [ApplicationStatusChoice]!
    $textSearch: String
    $orderBy: [ApplicationOrderingChoices]
    $first: Int
    $offset: Int
  ) {
    applications(
      applicationRound: $applicationRound
      unit: $unit
      applicantType: $applicantType
      status: $status
      textSearch: $textSearch
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          pk
          status
          ...ApplicationNameFragment
          applicationSections {
            name
            pk
            ...ApplicationDurationFragment
            reservationUnitOptions {
              preferredOrder
              reservationUnit {
                unit {
                  pk
                  nameFi
                }
              }
            }
          }
        }
      }
      totalCount
    }
  }
`;

// TODO change the type $orderBy: String
// TODO the fragment includes reservationUnit.applicationRoundTimeSlots which is not needed for allocation
// it's used on ui to show the time slots for the reservation unit
// and the fragment is shared
// also it includes nameEn, nameSv for reservationUnit, unit, purpose
// TODO see if we can use a different primary query for the listing page?
// TODO rename (there is no Events anymore)
// TODO see if we can remove some of the fields (like reservationUnitOptions)
// NOTE this can't be cached (probably) because of the duplicate versions
export const APPLICATIONS_EVENTS_QUERY = gql`
  ${APPLICATION_SECTION_FRAGMENT}
  query getApplicationSections(
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
    $offset: Int
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
      offset: $offset
    ) {
      edges {
        node {
          ...ApplicationSectionFragment
          allocations
          reservationUnitOptions {
            allocatedTimeSlots {
              pk
              dayOfTheWeek
              beginTime
              endTime
              reservationUnitOption {
                applicationSection {
                  pk
                }
              }
            }
          }
        }
      }
      totalCount
    }
  }
`;

// NOTE have to design a separate query for allocation page (a bit different data than the listing page)
// primarily we need to define reservationUnit parameter as a singular pk instead of array (because of the related allocated time slots)
export const APPLICATION_SECTIONS_FOR_ALLOCATION_QUERY = gql`
  ${APPLICATION_SECTION_FRAGMENT}
  query getApplicationSections(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $status: [ApplicationSectionStatusChoice]
    $applicantType: [ApplicantTypeChoice]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Priority]
    $purpose: [Int]
    $reservationUnit: Int
    $ageGroup: [Int]
    $homeCity: [Int]
    $includePreferredOrder10OrHigher: Boolean
  ) {
    applicationSections(
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      status: $status
      applicantType: $applicantType
      preferredOrder: $preferredOrder
      textSearch: $textSearch
      priority: $priority
      purpose: $purpose
      reservationUnit: [$reservationUnit]
      ageGroup: $ageGroup
      homeCity: $homeCity
      includePreferredOrder10OrHigher: $includePreferredOrder10OrHigher
    ) {
      edges {
        node {
          ...ApplicationSectionFragment
          allocations
          suitableTimeRanges(fulfilled: false) {
            beginTime
            endTime
            dayOfTheWeek
            priority
            fulfilled
          }
          reservationUnitOptions {
            allocatedTimeSlots {
              pk
              dayOfTheWeek
              beginTime
              endTime
              reservationUnitOption {
                applicationSection {
                  pk
                }
              }
            }
          }
        }
      }
      totalCount
    }
  }
`;

export const AFFECTING_ALLOCATED_TIME_SLOTS_QUERY = gql`
  query getAffectingAllocations(
    $reservationUnit: Int!
    $beginDate: Date!
    $endDate: Date!
  ) {
    affectingAllocatedTimeSlots(
      reservationUnit: $reservationUnit
      beginDate: $beginDate
      endDate: $endDate
    ) {
      beginTime
      dayOfTheWeek
      endTime
    }
  }
`;

export const ALLOCATED_TIME_SLOTS_QUERY = gql`
  ${APPLICANT_NAME_FRAGMENT}
  query getAllocatedTimeSlots(
    $applicationRound: Int!
    $allocatedUnit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $applicationSectionStatus: [ApplicationSectionStatusChoice]
    $allocatedReservationUnit: [Int]
    $dayOfTheWeek: [Weekday]
    $textSearch: String
    $orderBy: [AllocatedTimeSlotOrderingChoices]
    $first: Int
    $offset: Int
  ) {
    allocatedTimeSlots(
      applicationRound: $applicationRound
      allocatedUnit: $allocatedUnit
      applicantType: $applicantType
      applicationSectionStatus: $applicationSectionStatus
      allocatedReservationUnit: $allocatedReservationUnit
      dayOfTheWeek: $dayOfTheWeek
      textSearch: $textSearch
      orderBy: $orderBy
      first: $first
      offset: $offset
    ) {
      edges {
        node {
          pk
          dayOfTheWeek
          endTime
          beginTime
          reservationUnitOption {
            rejected
            locked
            preferredOrder
            applicationSection {
              pk
              name
              reservationsEndDate
              reservationsBeginDate
              reservationMinDuration
              reservationMaxDuration
              application {
                pk
                ...ApplicationNameFragment
              }
            }
            reservationUnit {
              nameFi
              unit {
                nameFi
              }
            }
          }
        }
      }
      totalCount
    }
  }
`;
