import { gql } from "@apollo/client";

/* minimal query for allocation page to populate the unit filter and reservation-units tabs
 * only needs to be done once when landing on the page
 * filtered queries only include the reservation-units that match the filters
 */
export const APPLICATION_ROUND_FILTER_OPTIONS = gql`
  query ApplicationRound($id: ID!) {
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
  mutation ($input: AllocatedTimeSlotCreateMutationInput!) {
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
  mutation ($input: AllocatedTimeSlotDeleteMutationInput!) {
    deleteAllocatedTimeslot(input: $input) {
      deleted
    }
  }
`;
