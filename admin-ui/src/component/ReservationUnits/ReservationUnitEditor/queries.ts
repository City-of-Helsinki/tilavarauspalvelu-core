import { gql } from "@apollo/client";

export const RESERVATIONUNIT_QUERY = gql`
  query reservationUnit($pk: Int) {
    reservationUnitByPk(pk: $pk) {
      lowestPrice
      highestPrice
      state
      priceUnit
      images {
        pk
        mediumUrl
        imageType
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
      authentication
      spaces {
        pk
        nameFi
      }
      resources {
        pk
        nameFi
      }
      services {
        pk
        nameFi
      }
      purposes {
        pk
        nameFi
      }
      paymentType
      pricingType
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
      additionalInstructionsFi
      additionalInstructionsSv
      additionalInstructionsEn
      maxReservationDuration
      minReservationDuration
      reservationStartInterval
      canApplyFreeOfCharge
      reservationsMinDaysBefore
      reservationsMaxDaysBefore
      images {
        imageType
        imageUrl
      }
      pk
      location {
        addressStreetFi
        addressZip
        addressCityFi
        longitude
        latitude
      }
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
      taxPercentage {
        pk
      }
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
    }
  }
`;

export const UPDATE_RESERVATION_UNIT = gql`
  mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
    updateReservationUnit(input: $input) {
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
