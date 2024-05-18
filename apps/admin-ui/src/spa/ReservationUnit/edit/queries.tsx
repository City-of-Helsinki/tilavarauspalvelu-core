import { gql } from "@apollo/client";
import { PRICING_FRAGMENT, IMAGE_FRAGMENT } from "common/src/queries/fragments";

export const RESERVATION_UNIT_EDIT_QUERY = gql`
  ${IMAGE_FRAGMENT}
  ${PRICING_FRAGMENT}
  query ReservationUnitEdit($id: ID!) {
    reservationUnit(id: $id) {
      id
      pk
      state
      reservationState
      images {
        pk
        ...ImageFragment
      }
      haukiUrl
      cancellationRule {
        pk
      }
      requireReservationHandling
      nameFi
      nameSv
      nameEn
      isDraft
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
      equipments {
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
        id
        pk
      }
      pricings {
        id
        ...PricingFields
        lowestPriceNet
        highestPriceNet
        taxPercentage {
          pk
        }
        pk
      }
      applicationRoundTimeSlots {
        id
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
    }
  }
`;

export const CREATE_RESERVATION_UNIT = gql`
  mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
    createReservationUnit(input: $input) {
      pk
    }
  }
`;

// TODO this allows for a pk input (is it for a change? i.e. not needing to delete and create a new one)
export const CREATE_IMAGE = gql`
  mutation createImage(
    $image: Upload!
    $reservationUnit: Int!
    $imageType: ImageType!
  ) {
    createReservationUnitImage(
      input: {
        image: $image
        reservationUnit: $reservationUnit
        imageType: $imageType
      }
    ) {
      pk
    }
  }
`;

export const DELETE_IMAGE = gql`
  mutation deleteImage($pk: ID!) {
    deleteReservationUnitImage(input: { pk: $pk }) {
      deleted
    }
  }
`;

export const UPDATE_IMAGE_TYPE = gql`
  mutation updateImage($pk: Int!, $imageType: ImageType!) {
    updateReservationUnitImage(input: { pk: $pk, imageType: $imageType }) {
      pk
    }
  }
`;

export const RESERVATION_UNIT_EDITOR_PARAMETERS = gql`
  query ReservationUnitEditorParameters {
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
