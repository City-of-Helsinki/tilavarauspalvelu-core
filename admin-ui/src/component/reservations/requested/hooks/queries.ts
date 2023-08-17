import { gql } from "@apollo/client";

import {
  RESERVATION_COMMON_FRAGMENT,
  RESERVATION_META_FRAGMENT,
  RESERVATION_RECURRING_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
  RESERVATION_UNIT_PRICING_FRAGMENT,
} from "../../fragments";

export const RESERVATIONS_BY_RESERVATIONUNIT = gql`
  query reservationUnitByPk($pk: Int, $from: Date, $to: Date) {
    reservationUnitByPk(pk: $pk) {
      reservations(
        from: $from
        to: $to
        state: [
          "DENIED"
          "CONFIRMED"
          "REQUIRES_HANDLING"
          "WAITING_FOR_PAYMENT"
        ]
        includeWithSameComponents: true
      ) {
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
        recurringReservation {
          pk
        }
      }
    }
  }
`;

// Possible optmisation: this fragment is only required for some queries.
const SPECIALISED_SINGLE_RESERVATION_FRAGMENT = gql`
  fragment ReservationSpecialisation on ReservationType {
    calendarUrl
    price
    taxPercentageValue
    orderUuid
    refundUuid
    cancelDetails
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
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      ...ReservationCommon
      ...ReservationRecurring
      ...ReservationSpecialisation
      reservationUnits {
        ...ReservationUnit
        ...ReservationUnitPricing
      }
      ...ReservationMetaFields
    }
  }
`;

export const RECURRING_RESERVATION_QUERY = gql`
  query recurringReservation(
    $pk: ID!
    $offset: Int
    $count: Int
    $state: [String]
  ) {
    reservations(
      offset: $offset
      recurringReservation: $pk
      state: $state
      first: $count
      orderBy: "begin"
    ) {
      edges {
        node {
          pk
          begin
          end
          state
          recurringReservation {
            pk
            weekdays
            beginDate
            endDate
          }
        }
      }
      totalCount
    }
  }
`;
