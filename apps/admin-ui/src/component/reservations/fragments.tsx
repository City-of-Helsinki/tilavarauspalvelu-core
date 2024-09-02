import { gql } from "@apollo/client";
import { UNIT_NAME_FRAGMENT } from "@/common/fragments";
import { PRICING_FRAGMENT } from "common/src/queries/fragments";

export const RESERVATION_UNIT_PRICING_FRAGMENT = gql`
  ${PRICING_FRAGMENT}
  fragment ReservationUnitPricing on ReservationUnitNode {
    pricings {
      id
      ...PricingFields
    }
  }
`;

export const RESERVATION_UNIT_FRAGMENT = gql`
  ${UNIT_NAME_FRAGMENT}
  fragment ReservationUnit on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    bufferTimeBefore
    bufferTimeAfter
    reservationStartInterval
    authentication
    unit {
      ...UnitNameFields
    }
    ...MetadataSets
    cancellationTerms {
      id
      textFi
      nameFi
    }
    paymentTerms {
      id
      textFi
      nameFi
    }
    pricingTerms {
      id
      textFi
      nameFi
    }
    termsOfUseFi
    serviceSpecificTerms {
      id
      textFi
      nameFi
    }
  }
`;

export const RESERVATION_RECURRING_FRAGMENT = gql`
  fragment ReservationRecurring on ReservationNode {
    recurringReservation {
      id
      pk
      beginDate
      endDate
      weekdays
      name
      description
    }
  }
`;

export const RESERVATION_COMMON_FRAGMENT = gql`
  fragment ReservationCommon on ReservationNode {
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
    }
    user {
      id
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
  ${RESERVATION_COMMON_FRAGMENT}
  fragment ReservationUnitReservations on ReservationNode {
    ...ReservationCommon
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
    user {
      id
      firstName
      lastName
      email
      pk
    }
    affectedReservationUnits
  }
`;
