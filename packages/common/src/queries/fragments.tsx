import { gql } from "@apollo/client";

export const RESERVEE_BILLING_FRAGMENT = gql`
  fragment ReserveeBillingFields on ReservationNode {
    id
    reserveeFirstName
    reserveeLastName
    reserveeEmail
    reserveePhone
    reserveeType
    reserveeOrganisationName
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
  }
`;

export const METAFIELDS_FRAGMENT = gql`
  fragment MetaFields on ReservationNode {
    ...ReserveeBillingFields
    applyingForFreeOfCharge
    freeOfChargeReason
    description
    numPersons
    ageGroup {
      id
      pk
      maximum
      minimum
    }
    purpose {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    homeCity {
      id
      pk
      nameFi
      nameSv
      nameEn
    }
  }
`;

export const TERMS_OF_USE_NAME_FRAGMENT = gql`
  fragment TermsOfUseNameFields on TermsOfUseNode {
    id
    nameFi
    nameEn
    nameSv
  }
`;

export const TERMS_OF_USE_TEXT_FRAGMENT = gql`
  fragment TermsOfUseTextFields on TermsOfUseNode {
    id
    textFi
    textEn
    textSv
  }
`;

export const TERMS_OF_USE_FRAGMENT = gql`
  fragment TermsOfUseFields on TermsOfUseNode {
    pk
    ...TermsOfUseNameFields
    ...TermsOfUseTextFields
    termsType
  }
`;

export const PRICING_FRAGMENT = gql`
  fragment PricingFields on ReservationUnitPricingNode {
    id
    begins
    priceUnit
    paymentType
    lowestPrice
    highestPrice
    taxPercentage {
      id
      pk
      value
    }
  }
`;

// TODO could split it into MEDIUM, LARGE, SMALL fragments (the imageUrl is required for all)
export const IMAGE_FRAGMENT = gql`
  fragment Image on ReservationUnitImageNode {
    id
    imageUrl
    largeUrl
    mediumUrl
    smallUrl
    imageType
  }
`;

export const LOCATION_FRAGMENT = gql`
  fragment LocationFields on UnitNode {
    id
    addressStreetFi
    addressCityFi
    addressZip
  }
`;

export const LOCATION_FRAGMENT_I18N = gql`
  fragment LocationFieldsI18n on UnitNode {
    ...LocationFields
    addressStreetEn
    addressStreetSv
    addressCityEn
    addressCitySv
  }
`;

export const BANNER_NOTIFICATION_COMMON_FRAGMENT = gql`
  fragment BannerNotificationCommon on BannerNotificationNode {
    id
    level
    activeFrom
    messageEn
    messageFi
    messageSv
  }
`;

export const METADATA_SETS_FRAGMENT = gql`
  fragment MetadataSets on ReservationUnitNode {
    id
    minPersons
    maxPersons
    metadataSet {
      id
      requiredFields {
        id
        fieldName
      }
      supportedFields {
        id
        fieldName
      }
    }
  }
`;
