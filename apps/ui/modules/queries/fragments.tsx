import { gql } from "@apollo/client";
import {
  PRICING_FRAGMENT,
  TERMS_OF_USE_NAME_FRAGMENT,
  TERMS_OF_USE_TEXT_FRAGMENT,
  IMAGE_FRAGMENT,
  LOCATION_FRAGMENT_I18N,
} from "common/src/queries/fragments";

// TODO improve naming of the fragments to match the purpose or use case

export const UNIT_NAME_FRAGMENT_I18N = gql`
  ${LOCATION_FRAGMENT_I18N}
  fragment UnitNameFieldsI18N on UnitNode {
    pk
    nameFi
    nameEn
    nameSv
    location {
      ...LocationFieldsI18n
    }
  }
`;

export const UNIT_FRAGMENT = gql`
  ${UNIT_NAME_FRAGMENT_I18N}
  fragment UnitFields on UnitNode {
    ...UnitNameFieldsI18N
    id
    tprekId
    location {
      latitude
      longitude
    }
  }
`;

// TODO
// NOTE only reservationUnit query requires the pricingTerms name (both need text)
export const RESERVATION_UNIT_FRAGMENT = gql`
  ${UNIT_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${TERMS_OF_USE_TEXT_FRAGMENT}
  ${TERMS_OF_USE_NAME_FRAGMENT}
  ${PRICING_FRAGMENT}
  fragment ReservationUnitFields on ReservationUnitNode {
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
      ...TermsOfUseNameFields
      ...TermsOfUseTextFields
    }
    pricings {
      ...PricingFields
    }
    images {
      ...ImageFragment
    }
    metadataSet {
      id
      name
      pk
      supportedFields {
        fieldName
      }
      requiredFields {
        fieldName
      }
    }
    minPersons
    maxPersons
  }
`;
