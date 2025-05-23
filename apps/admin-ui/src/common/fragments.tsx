import { gql } from "@apollo/client";

export const ALLOCATED_TIME_SLOT_FRAGMENT = gql`
  fragment AllocatedTimeSlot on AllocatedTimeSlotNode {
    id
    beginTime
    endTime
    dayOfTheWeek
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
    begin
    end
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
    ...ReserveeNameFields
    ...ReserveeBillingFields
    freeOfChargeReason
    applyingForFreeOfCharge
  }
`;

export const RECURRING_RESERVATION_FRAGMENT = gql`
  fragment RecurringReservationFields on RecurringReservationNode {
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
