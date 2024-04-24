import { gql } from "@apollo/client";
import {
  RESERVATION_COMMON_FRAGMENT,
  RESERVATION_META_FRAGMENT,
  RESERVATION_RECURRING_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
  RESERVATION_UNIT_PRICING_FRAGMENT,
} from "../../fragments";

const CALENDAR_RESERVATION_FRAGMENT = gql`
  fragment CalendarReservation on ReservationNode {
    user {
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
    $state: [String]
  ) {
    reservationUnit(id: $id) {
      reservationSet(state: $state, beginDate: $beginDate, endDate: $endDate) {
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
    calendarUrl
    price
    taxPercentageValue
    order {
      orderUuid
      refundUuid
    }
    cancelReason {
      reasonFi
    }
    denyReason {
      reasonFi
    }
    handlingDetails
    user {
      firstName
      lastName
      email
      pk
    }
    bufferTimeBefore
    bufferTimeAfter
  }
`;

export const SINGLE_RESERVATION_QUERY = gql`
  ${RESERVATION_META_FRAGMENT}
  ${RESERVATION_UNIT_FRAGMENT}
  ${RESERVATION_UNIT_PRICING_FRAGMENT}
  ${RESERVATION_COMMON_FRAGMENT}
  ${RESERVATION_RECURRING_FRAGMENT}
  ${SPECIALISED_SINGLE_RESERVATION_FRAGMENT}
  query reservation($id: ID!) {
    reservation(id: $id) {
      ...ReservationCommon
      ...ReservationRecurring
      ...ReservationSpecialisation
      reservationUnit {
        ...ReservationUnit
        ...ReservationUnitPricing
      }
      ...ReservationMetaFields
    }
  }
`;

// TODO do we need orderBy? orderBy: "begin" (for reservations)
// TODO do we need $state: [String]?
export const RECURRING_RESERVATION_QUERY = gql`
  query recurringReservation($id: ID!) {
    recurringReservation(id: $id) {
      pk
      weekdays
      beginDate
      endDate
      reservations {
        pk
        begin
        end
        state
        reservationUnit {
          pk
        }
      }
    }
  }
`;
