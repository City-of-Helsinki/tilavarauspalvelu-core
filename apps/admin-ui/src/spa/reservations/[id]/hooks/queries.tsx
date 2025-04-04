import { gql } from "@apollo/client";
import {
  RESERVATION_RECURRING_FRAGMENT,
  RESERVATION_UNIT_PRICING_FRAGMENT,
} from "../../fragments";
import {
  RESERVATION_COMMON_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
} from "@/common/fragments";
import {
  RESERVEE_BILLING_FRAGMENT,
  RESERVEE_NAME_FRAGMENT,
} from "common/src/queries/fragments";

const RESERVATION_META_FRAGMENT = gql`
  ${RESERVEE_NAME_FRAGMENT}
  ${RESERVEE_BILLING_FRAGMENT}
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

const CALENDAR_RESERVATION_FRAGMENT = gql`
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
  ${CALENDAR_RESERVATION_FRAGMENT}
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

// Possible optmisation: this fragment is only required for some queries.
const SPECIALISED_SINGLE_RESERVATION_FRAGMENT = gql`
  fragment ReservationSpecialisation on ReservationNode {
    id
    calendarUrl
    price
    taxPercentageValue
    paymentOrder {
      id
      orderUuid
      refundUuid
    }
    cancelReason {
      id
      reasonFi
    }
    denyReason {
      id
      reasonFi
    }
    handlingDetails
    user {
      id
      firstName
      lastName
      email
      pk
    }
    bufferTimeBefore
    bufferTimeAfter
  }
`;

const SINGLE_RESERVATION_ACCESS_TYPE_FRAGMENT = gql`
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

export const SINGLE_RESERVATION_QUERY = gql`
  ${RESERVATION_META_FRAGMENT}
  ${RESERVATION_UNIT_FRAGMENT}
  ${RESERVATION_UNIT_PRICING_FRAGMENT}
  ${RESERVATION_COMMON_FRAGMENT}
  ${RESERVATION_RECURRING_FRAGMENT}
  ${SPECIALISED_SINGLE_RESERVATION_FRAGMENT}
  ${SINGLE_RESERVATION_ACCESS_TYPE_FRAGMENT}
  query Reservation($id: ID!) {
    reservation(id: $id) {
      ...ReservationCommon
      ...ReservationRecurring
      ...ReservationSpecialisation
      ...ReservationAccessType
      reservationUnits {
        ...ReservationUnit
        ...ReservationUnitPricing
      }
      ...ReservationMetaFields
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
