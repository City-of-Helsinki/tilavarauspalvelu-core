import { gql } from "@apollo/client";
import { UNIT_NAME_FRAGMENT } from "app/common/fragments";
import {
  RESERVEE_NAME_FRAGMENT,
  RESERVEE_BILLING_FRAGMENT,
  PRICING_FRAGMENT,
} from "common/src/queries/fragments";

export const RESERVATION_META_FRAGMENT = gql`
  ${RESERVEE_NAME_FRAGMENT}
  ${RESERVEE_BILLING_FRAGMENT}
  fragment ReservationMetaFields on ReservationNode {
    ageGroup {
      minimum
      maximum
      pk
    }
    purpose {
      nameFi
      pk
    }
    homeCity {
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
    metadataSet {
      id
      name
      supportedFields {
        id
        fieldName
      }
      requiredFields {
        id
        fieldName
      }
    }
    cancellationTerms {
      id
      textFi
      nameFi
    }
    paymentTerms {
      textFi
      nameFi
    }
    pricingTerms {
      textFi
      nameFi
    }
    termsOfUseFi
    serviceSpecificTerms {
      textFi
      nameFi
    }
  }
`;

export const RESERVATION_RECURRING_FRAGMENT = gql`
  fragment ReservationRecurring on ReservationNode {
    recurringReservation {
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
    order {
      status
    }
    user {
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
// TODO why do we need the pk of the unit and serviceSector
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
        serviceSectors {
          pk
        }
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
