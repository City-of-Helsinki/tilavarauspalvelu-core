import { gql } from "@apollo/client";

export const ALLOCATED_TIME_SLOT_FRAGMENT = gql`
  fragment AllocatedTimeSlot on AllocatedTimeSlotNode {
    id
    beginTime
    endTime
    dayOfTheWeek
  }
`;

// TODO don't use convenience fragments
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

// TODO ReservationCommon has extra fields: [order, createdAt]
// TODO do we still need the user here?
// TODO what is the reservation name vs. reserveeName?
export const RESERVATIONUNIT_RESERVATIONS_FRAGMENT = gql`
  fragment ReservationUnitReservations on ReservationNode {
    ...ReservationCommonFields
    ...VisibleIfPermissionFields
    name
    numPersons
    calendarUrl
    reservationUnits {
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

export const RESERVATION_META_FRAGMENT = gql`
  fragment ReservationMetaFields on ReservationNode {
    ageGroup {
      id
      minimum
      maximum
      pk
    }
    purpose {
      id
      nameFi
      pk
    }
    homeCity {
      id
      nameFi
      pk
    }
    numPersons
    name
    description
    ...ReserveeBillingFields
    freeOfChargeReason
    applyingForFreeOfCharge
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
      reservationUnits {
        id
        unit {
          id
          pk
        }
      }
    }
  }
`;

// TODO don't use convenience fragments
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

export const CANCEL_REASON_FRAGMENT = gql`
  fragment CancelReasonFields on ReservationCancelReasonType {
    value
    reasonFi
  }
`;
