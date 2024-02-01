import { gql } from "@apollo/client";

// TODO improve naming of the fragments to match the purpose or use case

export const TERMS_OF_USE_TEXT_FRAGMENT = gql`
  fragment TermsOfUseTextFields on TermsOfUseType {
    textFi
    textEn
    textSv
  }
`;

// TODO refactor admin-ui and common to use this fragment where ever images are used
// could also split it into MEDIUM, LARGE, SMALL fragments (the imageUrl is required for all)
export const IMAGE_FRAGMENT = gql`
  fragment ImageFields on ReservationUnitImageType {
    imageUrl
    largeUrl
    mediumUrl
    smallUrl
    imageType
  }
`;

// TODO really unit location fragment, but it's missing the addressZip and addressCity fields
// TODO could futher fragment the address fields
export const UNIT_NAME_FRAGMENT = gql`
  fragment UnitNameFields on UnitType {
    pk
    nameFi
    nameEn
    nameSv
    location {
      addressStreetFi
      addressStreetEn
      addressStreetSv
    }
  }
`;

export const UNIT_FRAGMENT = gql`
  fragment UnitFields on UnitType {
    id
    pk
    tprekId
    nameFi
    nameEn
    nameSv
    location {
      latitude
      longitude
      addressStreetFi
      addressStreetEn
      addressStreetSv
      addressZip
      addressCityFi
      addressCityEn
      addressCitySv
    }
  }
`;

export const PRICING_FRAGMENT = gql`
  fragment PricingFields on ReservationUnitPricingType {
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

// TODO
// NOTE only reservationUnit query requires the pricingTerms name (both need text)
export const RESERVATION_UNIT_FRAGMENT = gql`
  ${UNIT_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${TERMS_OF_USE_TEXT_FRAGMENT}
  ${PRICING_FRAGMENT}
  fragment ReservationUnitFields on ReservationUnitType {
    unit {
      ...UnitFields
    }
    pk
    uuid
    nameFi
    nameEn
    nameSv
    reservationPendingInstructionsFi
    reservationPendingInstructionsEn
    reservationPendingInstructionsSv
    reservationConfirmedInstructionsFi
    reservationConfirmedInstructionsEn
    reservationConfirmedInstructionsSv
    reservationCancelledInstructionsFi
    reservationCancelledInstructionsEn
    reservationCancelledInstructionsSv
    termsOfUseFi
    termsOfUseEn
    termsOfUseSv
    serviceSpecificTerms {
      ...TermsOfUseTextFields
    }
    cancellationTerms {
      ...TermsOfUseTextFields
    }
    paymentTerms {
      ...TermsOfUseTextFields
    }
    pricingTerms {
      ...TermsOfUseTextFields
      nameFi
      nameEn
      nameSv
    }
    pricings {
      ...PricingFields
    }
    images {
      ...ImageFields
    }
    spaces {
      pk
      nameFi
      nameEn
      nameSv
    }
    metadataSet {
      id
      name
      pk
      supportedFields
      requiredFields
    }
    minPersons
    maxPersons
  }
`;
