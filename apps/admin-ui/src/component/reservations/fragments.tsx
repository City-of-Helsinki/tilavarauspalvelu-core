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
  fragment ReservationMetaFields on ReservationType {
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
  fragment ReservationUnitPricing on ReservationUnitType {
    pricings {
      ...PricingFields
    }
  }
`;

export const RESERVATION_UNIT_FRAGMENT = gql`
  ${UNIT_NAME_FRAGMENT}
  fragment ReservationUnit on ReservationUnitType {
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
      name
      supportedFields
      requiredFields
    }
    cancellationTerms {
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
  fragment ReservationRecurring on ReservationType {
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
  fragment ReservationCommon on ReservationType {
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
  fragment ReservationUnitReservations on ReservationUnitType {
    reservations(
      from: $from
      to: $to
      includeWithSameComponents: $includeWithSameComponents
      state: [
        "CREATED"
        "CONFIRMED"
        "REQUIRES_HANDLING"
        "WAITING_FOR_PAYMENT"
      ]
    ) {
      ...ReservationCommon
      name
      numPersons
      calendarUrl
      reservationUnits {
        pk
        nameFi
        bufferTimeBefore
        bufferTimeAfter
        unit {
          pk
          serviceSectors {
            pk
          }
        }
      }
      user {
        firstName
        lastName
        email
        pk
      }
    }
  }
`;
