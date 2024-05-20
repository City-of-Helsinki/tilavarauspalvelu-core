import { gql } from "@apollo/client";
import { APPLICATION_SECTION_ADMIN_FRAGMENT } from "common/src/queries/application";

/* minimal query for allocation page to populate the unit filter and reservation-units tabs
 * only needs to be done once when landing on the page
 * filtered queries only include the reservation-units that match the filters
 */
export const APPLICATION_ROUND_FILTER_OPTIONS = gql`
  query ApplicationRoundFilter($id: ID!) {
    applicationRound(id: $id) {
      nameFi
      status
      reservationPeriodBegin
      reservationPeriodEnd
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
`;

// Query the count of the application events for that specific unit + reservationUnit
export const ALL_EVENTS_PER_UNIT_QUERY = gql`
  query AllApplicationEvents(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $unit: [Int]!
    $reservationUnit: [Int]!
  ) {
    applicationSections(
      applicationRound: $applicationRound
      reservationUnit: $reservationUnit
      unit: $unit
      applicationStatus: $applicationStatus
    ) {
      edges {
        node {
          reservationUnitOptions {
            reservationUnit {
              pk
              nameFi
            }
          }
        }
      }
      totalCount
    }
  }
`;

export const CREATE_ALLOCATED_TIME_SLOT = gql`
  mutation CreateAllocatedTimeSlot(
    $input: AllocatedTimeSlotCreateMutationInput!
  ) {
    createAllocatedTimeslot(input: $input) {
      beginTime
      dayOfTheWeek
      endTime
      pk
      reservationUnitOption
    }
  }
`;

export const DELETE_ALLOCATED_TIME_SLOT = gql`
  mutation DeleteAllocatedTimeSlot(
    $input: AllocatedTimeSlotDeleteMutationInput!
  ) {
    deleteAllocatedTimeslot(input: $input) {
      deleted
    }
  }
`;

/// NOTE have to design a separate query for allocation page (a bit different data than the listing page)
/// primarily we need to define reservationUnit parameter as a singular pk instead of array (because of the related allocated time slots)
/// NOTE Requires higher backend optimizer complexity limit (14 works, lower doesn't)
export const APPLICATION_SECTIONS_FOR_ALLOCATION_QUERY = gql`
  ${APPLICATION_SECTION_ADMIN_FRAGMENT}
  query ApplicationSectionAllocations(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $status: [ApplicationSectionStatusChoice]
    $applicantType: [ApplicantTypeChoice]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Priority]
    $purpose: [Int]
    $reservationUnit: Int!
    $beginDate: Date!
    $endDate: Date!
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
            id
            beginTime
            endTime
            dayOfTheWeek
            priority
            fulfilled
          }
          reservationUnitOptions {
            id
            pk
            locked
            rejected
            allocatedTimeSlots {
              id
              pk
              dayOfTheWeek
              beginTime
              endTime
              reservationUnitOption {
                pk
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
    affectingAllocatedTimeSlots(
      reservationUnit: $reservationUnit
      beginDate: $beginDate
      endDate: $endDate
    ) {
      id
      beginTime
      dayOfTheWeek
      endTime
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

export const UPDATE_RESERVATION_UNIT_OPTION = gql`
  mutation RejectRest($input: ReservationUnitOptionUpdateMutationInput!) {
    updateReservationUnitOption(input: $input) {
      pk
      rejected
      locked
    }
  }
`;
