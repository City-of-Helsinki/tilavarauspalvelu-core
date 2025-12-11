import { gql } from "@apollo/client";

export const ALLOCATED_TIME_SLOT_FRAGMENT = gql`
  fragment AllocatedTimeSlot on AllocatedTimeSlotNode {
    id
    beginTime
    endTime
    dayOfTheWeek
  }
`;

export const APPLICATION_SECTION_COMMON_FRAGMENT = gql`
  fragment ApplicationSectionCommon on ApplicationSectionNode {
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
    }
  }
`;

// NOTE this is for allocation only (it includes the application name)
// for regular application queries we don't need to query the name through the application relation
export const APPLICATION_SECTION_ADMIN_FRAGMENT = gql`
  fragment ApplicationSectionFields on ApplicationSectionNode {
    ...ApplicationSectionCommon
    purpose {
      id
      pk
      nameFi
    }
    application {
      id
      pk
      status
      ...ApplicationName
    }
    reservationUnitOptions {
      id
      reservationUnit {
        id
        pk
        nameFi
        unit {
          id
          pk
          nameFi
        }
      }
    }
  }
`;

export const RESERVATION_COMMON_FRAGMENT = gql`
  fragment ReservationCommonFields on ReservationNode {
    id
    pk
    beginsAt
    endsAt
    createdAt
    state
    type
    isBlocked
    workingMemo
    reserveeName
    paymentOrder {
      id
      status
      handledPaymentDueBy
    }
    user {
      id
      email
      firstName
      lastName
      isStronglyAuthenticated
      isAdAuthenticated
    }
    bufferTimeBefore
    bufferTimeAfter
  }
`;

export const RESERVATIONUNIT_RESERVATIONS_FRAGMENT = gql`
  fragment ReservationUnitReservations on ReservationNode {
    ...ReservationCommonFields
    ...VisibleIfPermissionFields
    name
    numPersons
    calendarUrl
    reservationUnit {
      id
      pk
      nameFi
      bufferTimeBefore
      bufferTimeAfter
      unit {
        id
        pk
      }
    }
    affectedReservationUnits
  }
`;

export const RECURRING_RESERVATION_FRAGMENT = gql`
  fragment ReservationSeriesFields on ReservationSeriesNode {
    id
    pk
    weekdays
    beginDate
    endDate
    rejectedOccurrences {
      id
      beginDatetime
      endDatetime
      rejectionReason
    }
    reservations {
      ...ChangeReservationTime
      state
      paymentOrder {
        id
        status
      }
      reservationUnit {
        id
        unit {
          id
          pk
        }
      }
    }
  }
`;

export const APPLICATION_ROUND_TIME_SLOTS_FRAGMENT = gql`
  fragment ApplicationRoundTimeSlots on ApplicationRoundTimeSlotNode {
    id
    pk
    weekday
    isClosed
    reservableTimes {
      begin
      end
    }
  }
`;
