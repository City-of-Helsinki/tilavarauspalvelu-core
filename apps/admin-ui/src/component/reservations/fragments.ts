import { gql } from "@apollo/client";

export const RESERVATION_META_FRAGMENT = gql`
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
    reserveeType
    reserveeIsUnregisteredAssociation
    name
    description
    reserveeFirstName
    reserveeLastName
    reserveePhone
    reserveeOrganisationName
    reserveeEmail
    reserveeId
    reserveeIsUnregisteredAssociation
    reserveeAddressStreet
    reserveeAddressCity
    reserveeAddressZip
    billingFirstName
    billingLastName
    billingPhone
    billingEmail
    billingAddressStreet
    billingAddressCity
    billingAddressZip
    freeOfChargeReason
    applyingForFreeOfCharge
  }
`;

export const RESERVATION_UNIT_PRICING_FRAGMENT = gql`
  fragment ReservationUnitPricing on ReservationUnitType {
    pricings {
      begins
      pricingType
      priceUnit
      lowestPrice
      highestPrice
      taxPercentage {
        value
      }
      status
    }
  }
`;

export const RESERVATION_UNIT_FRAGMENT = gql`
  fragment ReservationUnit on ReservationUnitType {
    pk
    nameFi
    maxPersons
    bufferTimeBefore
    bufferTimeAfter
    reservationStartInterval
    unit {
      pk
      nameFi
      serviceSectors {
        pk
      }
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
    orderStatus
    bufferTimeBefore
    bufferTimeAfter
  }
`;

// NOTE can't reuse the fragment on a different types without an interface
// and our schema is borked: having both ReservationUnitType and ReservationUnitByPkType
// so use only the plural reservationUnits version of the query with this.
export const RESERVATIONUNIT_RESERVATIONS_FRAGMENT = gql`
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
      pk
      name
      type
      priority
      begin
      end
      state
      numPersons
      calendarUrl
      bufferTimeBefore
      bufferTimeAfter
      workingMemo
      reserveeName
      isBlocked
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
