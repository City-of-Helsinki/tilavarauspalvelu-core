import { gql } from "@apollo/client";

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

export const CALENDAR_RESERVATION_FRAGMENT = gql`
  fragment CalendarReservation on ReservationNode {
    id
    user {
      id
      email
    }
    name
    reserveeName
    pk
    begin
    end
    state
    type
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
    accessType
  }
`;

// TODO there is two versions of this query.
// This is used in the hooks (collision checks).
export const RESERVATIONS_BY_RESERVATIONUNITS = gql`
  query ReservationsByReservationUnit(
    $id: ID!
    $pk: Int!
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      id
      reservations(state: $state, beginDate: $beginDate, endDate: $endDate) {
        ...CalendarReservation
      }
    }
    affectingReservations(
      forReservationUnits: [$pk]
      state: $state
      beginDate: $beginDate
      endDate: $endDate
    ) {
      ...CalendarReservation
    }
  }
`;

export const SINGLE_RESERVATION_ACCESS_TYPE_FRAGMENT = gql`
  fragment ReservationAccessType on ReservationNode {
    id
    accessType
    isAccessCodeIsActiveCorrect
    pindoraInfo {
      accessCode
      accessCodeIsActive
      accessCodeBeginsAt
      accessCodeEndsAt
    }
  }
`;

export const RESERVATION_RECURRING_FRAGMENT = gql`
  fragment ReservationRecurringFields on RecurringReservationNode {
    id
    pk
    beginDate
    beginTime
    endDate
    endTime
    weekdays
    name
    description
    usedAccessTypes
    isAccessCodeIsActiveCorrect
    pindoraInfo {
      accessCode
      accessCodeIsActive
      accessCodeValidity {
        accessCodeBeginsAt
        accessCodeEndsAt
      }
    }
  }
`;

export const RECURRING_RESERVATION_FRAGMENT = gql`
  fragment RecurringReservation on RecurringReservationNode {
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

// TODO do we need orderBy? orderBy: "begin" (for reservations)
// TODO do we need $state: [String]?
export const RECURRING_RESERVATION_QUERY = gql`
  query RecurringReservation($id: ID!) {
    recurringReservation(id: $id) {
      ...RecurringReservation
    }
  }
`;
