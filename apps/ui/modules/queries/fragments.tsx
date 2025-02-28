import { gql } from "@apollo/client";

export const UNIT_NAME_FRAGMENT_I18N = gql`
  fragment UnitNameFieldsI18N on UnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    location {
      ...LocationFieldsI18n
    }
  }
`;

export const TERMS_OF_USE_FRAGMENT = gql`
  fragment TermsOfUse on ReservationUnitNode {
    id
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
  }
`;

export const CANCEL_REASON_FRAGMENT = gql`
  fragment CancelReasonFields on ReservationCancelReasonNode {
    id
    pk
    reasonFi
    reasonEn
    reasonSv
  }
`;
