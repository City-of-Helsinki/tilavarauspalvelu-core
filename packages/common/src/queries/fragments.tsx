import { gql } from "@apollo/client";

export const RESERVEE_NAME_FRAGMENT = gql`
  fragment ReserveeNameFields on ReservationNode {
    reserveeFirstName
    reserveeLastName
    reserveeEmail
    reserveePhone
    reserveeType
    reserveeOrganisationName
  }
`;

export const RESERVEE_BILLING_FRAGMENT = gql`
  fragment ReserveeBillingFields on ReservationNode {
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

export const TERMS_OF_USE_NAME_FRAGMENT = gql`
  fragment TermsOfUseNameFields on TermsOfUseNode {
    nameFi
    nameEn
    nameSv
  }
`;

export const TERMS_OF_USE_TEXT_FRAGMENT = gql`
  fragment TermsOfUseTextFields on TermsOfUseNode {
    textFi
    textEn
    textSv
  }
`;

export const TERMS_OF_USE_FRAGMENT = gql`
  ${TERMS_OF_USE_NAME_FRAGMENT}
  ${TERMS_OF_USE_TEXT_FRAGMENT}
  fragment TermsOfUseFields on TermsOfUseNode {
    pk
    ...TermsOfUseNameFields
    ...TermsOfUseTextFields
    termsType
  }
`;

export const PRICING_FRAGMENT = gql`
  fragment PricingFields on ReservationUnitPricingNode {
    begins
    priceUnit
    pricingType
    lowestPrice
    highestPrice
    taxPercentage {
      value
    }
    status
  }
`;

// TODO could split it into MEDIUM, LARGE, SMALL fragments (the imageUrl is required for all)
export const IMAGE_FRAGMENT = gql`
  fragment ImageFragment on ReservationUnitImageNode {
    imageUrl
    largeUrl
    mediumUrl
    smallUrl
    imageType
  }
`;

export const LOCATION_FRAGMENT = gql`
  fragment LocationFields on LocationNode {
    addressStreetFi
    addressZip
    addressCityFi
  }
`;

export const LOCATION_FRAGMENT_I18N = gql`
  ${LOCATION_FRAGMENT}
  fragment LocationFieldsI18n on LocationNode {
    ...LocationFields
    addressStreetEn
    addressStreetSv
    addressCityEn
    addressCitySv
  }
`;
