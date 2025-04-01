import { gql } from "@apollo/client";

export const APPLICATION_ADMIN_FRAGMENT = gql`
  fragment ApplicationAdmin on ApplicationNode {
    pk
    id
    status
    lastModifiedDate
    ...Applicant
    applicationRound {
      id
      pk
      nameFi
    }
    applicationSections {
      ...ApplicationSectionCommon
      suitableTimeRanges {
        ...SuitableTime
      }
      purpose {
        id
        pk
        nameFi
        nameSv
        nameEn
      }
      allocations
      reservationUnitOptions {
        id
        ...ReservationUnitOption
        rejected
        allocatedTimeSlots {
          pk
          id
        }
      }
    }
  }
`;

export const APPLICATION_ADMIN_QUERY = gql`
  query ApplicationAdmin($id: ID!) {
    application(id: $id) {
      ...ApplicationAdmin
      workingMemo
      user {
        id
        email
      }
    }
  }
`;

export const REJECT_ALL_SECTION_OPTIONS = gql`
  mutation RejectAllSectionOptions(
    $input: RejectAllSectionOptionsMutationInput!
  ) {
    rejectAllSectionOptions(input: $input) {
      pk
    }
  }
`;

export const RESTORE_ALL_SECTION_OPTIONS = gql`
  mutation RestoreAllSectionOptions(
    $input: RestoreAllSectionOptionsMutationInput!
  ) {
    restoreAllSectionOptions(input: $input) {
      pk
    }
  }
`;

export const REJECT_APPLICATION = gql`
  mutation RejectAllApplicationOptions(
    $input: RejectAllApplicationOptionsMutationInput!
  ) {
    rejectAllApplicationOptions(input: $input) {
      pk
    }
  }
`;

export const RESTORE_APPLICATION = gql`
  mutation RestoreAllApplicationOptions(
    $input: RestoreAllApplicationOptionsMutationInput!
  ) {
    restoreAllApplicationOptions(input: $input) {
      pk
    }
  }
`;

export const APPLICATION_ROUND_TIME_SLOTS_FRAGMENT = gql`
  fragment ApplicationRoundTimeSlots on ApplicationRoundTimeSlotNode {
    id
    pk
    weekday
    closed
    reservableTimes {
      begin
      end
    }
  }
`;

export const RESERVATION_UNIT_OPTION_FRAGMENT = gql`
  fragment ReservationUnitOption on ReservationUnitOptionNode {
    id
    reservationUnit {
      id
      pk
      nameFi
      nameEn
      nameSv
      unit {
        id
        pk
        nameFi
        nameEn
        nameSv
      }
      applicationRoundTimeSlots {
        ...ApplicationRoundTimeSlots
      }
    }
  }
`;
