import { gql } from "@apollo/client";

import {
  RESERVATION_COMMON_FRAGMENT,
  RESERVATION_META_FRAGMENT,
  RESERVATION_RECURRING_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
  RESERVATION_UNIT_PRICING_FRAGMENT,
} from "../../fragments";

export const RESERVATIONS_BY_RESERVATIONUNIT = gql`
  query reservationsByReservationUnit(
    $reservationUnit: [ID]
    $offset: Int
    $first: Int
    $begin: DateTime
    $end: DateTime
  ) {
    reservations(
      begin: $begin
      end: $end
      first: $first
      offset: $offset
      reservationUnit: $reservationUnit
      state: ["DENIED", "CONFIRMED", "REQUIRES_HANDLING", "WAITING_FOR_PAYMENT"]
    ) {
      edges {
        node {
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
          recurringReservation {
            pk
          }
        }
      }
      pageInfo {
        hasNextPage
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
    user {
      firstName
      lastName
      email
      pk
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
          }
        }
      }
      totalCount
    }
  }
`;
