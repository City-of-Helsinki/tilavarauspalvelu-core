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

export const RESERVATION_UNIT_FRAGMENT = gql`
  fragment ReservationUnit on ReservationUnitType {
    nameFi
    maxPersons
    pk
    bufferTimeBefore
    bufferTimeAfter
    reservationStartInterval
    unit {
      pk
      nameFi
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

export const RESERVATION_COMMON_FRAGMENT = gql`
  fragment ReservationCommon on ReservationType {
    pk
    createdAt
    state
    begin
    end
    orderStatus
  }
`;
