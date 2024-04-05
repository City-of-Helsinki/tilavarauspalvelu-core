import { gql } from "@apollo/client";
import { PRICING_FRAGMENT, IMAGE_FRAGMENT } from "common/src/queries/fragments";

export const RESERVATIONUNIT_QUERY = gql`
  ${IMAGE_FRAGMENT}
  ${PRICING_FRAGMENT}
  query ReservationUnitEdit($id: ID!) {
    reservationUnit(id: $id) {
      pk
      state
      reservationState
      images {
        pk
        ...ImageFragment
      }
      haukiUrl {
        url
      }
      cancellationRule {
        pk
      }
      requireReservationHandling
      nameFi
      nameSv
      nameEn
      isDraft
      isArchived
      authentication
      spaces {
        pk
        nameFi
      }
      resources {
        pk
        nameFi
      }
      purposes {
        pk
        nameFi
      }
      paymentTypes {
        code
      }
      pricingTerms {
        pk
      }
      reservationUnitType {
        pk
        nameFi
      }
      uuid
      requireIntroduction
      termsOfUseFi
      termsOfUseSv
      termsOfUseEn
      reservationKind
      reservationPendingInstructionsFi
      reservationPendingInstructionsSv
      reservationPendingInstructionsEn
      reservationConfirmedInstructionsFi
      reservationConfirmedInstructionsSv
      reservationConfirmedInstructionsEn
      reservationCancelledInstructionsFi
      reservationCancelledInstructionsSv
      reservationCancelledInstructionsEn
      maxReservationDuration
      minReservationDuration
      reservationStartInterval
      canApplyFreeOfCharge
      reservationsMinDaysBefore
      reservationsMaxDaysBefore
      equipment {
        pk
        nameFi
      }
      qualifiers {
        pk
        nameFi
      }
      unit {
        pk
        nameFi
      }
      minPersons
      maxPersons
      surfaceArea
      descriptionFi
      descriptionSv
      descriptionEn
      paymentTerms {
        pk
      }
      cancellationTerms {
        pk
      }
      serviceSpecificTerms {
        pk
      }
      reservationBlockWholeDay
      bufferTimeBefore
      bufferTimeAfter
      reservationBegins
      contactInformation
      reservationEnds
      publishBegins
      publishEnds
      maxReservationsPerUser
      metadataSet {
        pk
      }
      pricings {
        ...PricingFields
        lowestPriceNet
        highestPriceNet
        taxPercentage {
          pk
        }
        pk
      }
      applicationRoundTimeSlots {
        pk
        closed
        weekday
        reservableTimes {
          begin
          end
        }
      }
    }
  }
`;

export const UPDATE_RESERVATION_UNIT = gql`
  mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
    updateReservationUnit(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const CREATE_RESERVATION_UNIT = gql`
  mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
    createReservationUnit(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const CREATE_IMAGE = gql`
  mutation createReservationUnitImage(
    $image: Upload!
    $reservationUnitPk: Int!
    $imageType: String!
  ) {
    createReservationUnitImage(
      input: {
        image: $image
        reservationUnitPk: $reservationUnitPk
        imageType: $imageType
      }
    ) {
      pk
      reservationUnitImage {
        pk
        imageType
        mediumUrl
      }
      errors {
        field
        messages
      }
    }
  }
`;

export const DELETE_IMAGE = gql`
  mutation deleteImage($pk: Int!) {
    deleteReservationUnitImage(input: { pk: $pk }) {
      errors
      deleted
    }
  }
`;

export const UPDATE_IMAGE_TYPE = gql`
  mutation updateImage($pk: Int!, $imageType: String!) {
    updateReservationUnitImage(input: { pk: $pk, imageType: $imageType }) {
      errors {
        messages
        field
      }
    }
  }
`;

export const RESERVATION_UNIT_EDITOR_PARAMETERS = gql`
  query reservation_unit_editor_parameters {
    equipments {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
    taxPercentages {
      edges {
        node {
          pk
          value
        }
      }
    }

    purposes {
      edges {
        node {
          pk
          nameFi
        }
      }
    }

    reservationUnitTypes {
      edges {
        node {
          nameFi
          pk
        }
      }
    }

    termsOfUse {
      edges {
        node {
          pk
          nameFi
          termsType
        }
      }
    }

    reservationUnitCancellationRules {
      edges {
        node {
          nameFi
          pk
        }
      }
    }

    metadataSets {
      edges {
        node {
          name
          pk
        }
      }
    }

    qualifiers {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
  }
`;
