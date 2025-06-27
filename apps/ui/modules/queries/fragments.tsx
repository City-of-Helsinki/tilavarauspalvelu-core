import { gql } from "@apollo/client";

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
  fragment CancelReasonFields on ReservationCancelReasonType {
    value
    reasonFi
    reasonEn
    reasonSv
  }
`;

export const CANCELLATION_RULE_FRAGMENT = gql`
  fragment CancellationRuleFields on ReservationUnitNode {
    id
    cancellationRule {
      id
      canBeCancelledTimeBefore
    }
  }
`;

export const BLOCKING_RESERVATION_FRAGMENT = gql`
  fragment BlockingReservationFields on ReservationNode {
    pk
    id
    state
    isBlocked
    beginsAt
    endsAt
    numPersons
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
  }
`;

export const PINDORA_RESERVATION_FRAGMENT = gql`
  fragment PindoraReservation on PindoraReservationInfoType {
    accessCode
    accessCodeBeginsAt
    accessCodeEndsAt
    accessCodeIsActive
  }
`;

export const PINDORA_SERIES_FRAGMENT = gql`
  fragment PindoraSeries on PindoraSeriesInfoType {
    accessCode
    accessCodeIsActive
    accessCodeValidity {
      accessCodeBeginsAt
      accessCodeEndsAt
      reservationId
      reservationSeriesId
    }
  }
`;

export const PINDORA_SECTION_FRAGMENT = gql`
  fragment PindoraSection on PindoraSectionInfoType {
    accessCode
    accessCodeIsActive
    accessCodeValidity {
      accessCodeBeginsAt
      accessCodeEndsAt
      reservationSeriesId
      reservationId
    }
  }
`;
