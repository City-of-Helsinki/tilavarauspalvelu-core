import { gql } from "@apollo/client";

export const SPACES_QUERY = gql`
  query getSpaces {
    spaces {
      edges {
        node {
          pk
          nameFi
          unit {
            pk
          }
          building {
            nameFi
            district {
              nameFi
            }
          }
          parent {
            nameFi
            building {
              nameFi
              district {
                nameFi
              }
            }
          }
          surfaceArea
          maxPersons
        }
      }
    }
  }
`;

export const RESOURCES_QUERY = gql`
  query getResources {
    resources {
      edges {
        node {
          pk
          nameFi
          locationType

          space {
            unit {
              nameFi
              pk
            }
            nameFi
            unit {
              nameFi
            }
          }
        }
      }
    }
  }
`;

export const RESERVATION_UNITS_QUERY = gql`
  query reservationUnits {
    reservationUnits {
      edges {
        node {
          pk
          nameFi
          unit {
            pk
            nameFi
          }

          reservationUnitType {
            nameFi
          }
          maxPersons
          surfaceArea
        }
      }
    }
  }
`;

export const SEARCH_RESERVATION_UNITS_QUERY = gql`
  query reservationUnits(
    $textSearch: String
    $maxPersonsGte: Float
    $maxPersonsLte: Float
  ) {
    reservationUnits(
      textSearch: $textSearch
      maxPersonsGte: $maxPersonsGte
      maxPersonsLte: $maxPersonsLte
    ) {
      edges {
        node {
          pk
          nameFi
          unit {
            nameFi
          }
          reservationUnitType {
            nameFi
          }
          images {
            imageType
            mediumUrl
          }
          maxPersons
          surfaceArea
        }
      }
    }
  }
`;

export const CREATE_SPACE = gql`
  mutation createSpace($input: SpaceCreateMutationInput!) {
    createSpace(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const UPDATE_SPACE = gql`
  mutation updateSpace($input: SpaceUpdateMutationInput!) {
    updateSpace(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const SPACE_HIERARCHY_QUERY = gql`
  query getSpaces {
    spaces {
      edges {
        node {
          pk
          nameFi
          parent {
            pk
          }
          unit {
            pk
          }
        }
      }
    }
  }
`;

export const UNITS_QUERY = gql`
  query units {
    units {
      edges {
        node {
          nameFi
          pk
          reservationUnits {
            pk
          }
          spaces {
            pk
          }
          location {
            longitude
            latitude
          }
        }
      }
    }
  }
`;

export const DELETE_SPACE = gql`
  mutation deleteSpace($input: SpaceDeleteMutationInput!) {
    deleteSpace(input: $input) {
      deleted
    }
  }
`;

export const UNIT_QUERY = gql`
  query unit($pk: Int) {
    unitByPk(pk: $pk) {
      pk
      nameFi
      tprekId
      shortDescriptionFi
      reservationUnits {
        pk
        nameFi
        maxPersons
        surfaceArea
        isDraft
        purposes {
          pk
          nameFi
        }
        reservationUnitType {
          pk
          nameFi
        }
        images {
          imageType
          mediumUrl
        }
      }
      spaces {
        pk
        nameFi
        code
        maxPersons
        surfaceArea
        parent {
          pk
          nameFi
        }
        resources {
          pk
          nameFi
          space {
            unit {
              nameFi
            }
          }
        }
      }
      location {
        addressStreetFi
        addressZip
        addressCityFi
        longitude
        latitude
      }
      nameFi
    }
  }
`;

export const UNIT_WITH_SPACES_AND_RESOURCES = gql`
  query unit($pk: Int) {
    unitByPk(pk: $pk) {
      pk
      nameFi
      spaces {
        pk
        nameFi
        maxPersons
        surfaceArea
        resources {
          pk
          nameFi
        }
      }
      location {
        addressStreetFi
        addressZip
        addressCityFi
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
  }
`;

export const RESERVATIONUNIT_IMAGES_QUERY = gql`
  query reservationUnit($pk: Int) {
    reservationUnitByPk(pk: $pk) {
      images {
        pk
        mediumUrl
        imageType
      }
    }
  }
`;

export const RESERVATIONUNIT_QUERY = gql`
  query reservationUnit($pk: Int) {
    reservationUnitByPk(pk: $pk) {
      lowestPrice
      highestPrice
      priceUnit
      haukiUrl {
        url
      }
      cancellationRule {
        pk
      }
      nameFi
      nameSv
      nameEn
      descriptionFi
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
      reservationUnitType {
        pk
        nameFi
      }
      uuid
      requireIntroduction
      termsOfUseFi
      termsOfUseSv
      termsOfUseEn
      additionalInstructionsFi
      additionalInstructionsSv
      additionalInstructionsEn
      contactInformationFi
      maxReservationDuration
      minReservationDuration
      reservationStartInterval
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
      unit {
        pk
      }
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

export const CREATE_RESOURCE = gql`
  mutation createResource($input: ResourceCreateMutationInput!) {
    createResource(input: $input) {
      errors {
        field
        messages
      }
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation updateResource($input: ResourceUpdateMutationInput!) {
    updateResource(input: $input) {
      errors {
        field
        messages
      }
    }
  }
`;

export const DELETE_RESOURCE = gql`
  mutation deleteResource($input: ResourceDeleteMutationInput!) {
    deleteResource(input: $input) {
      deleted
      errors
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

export const SPACE_QUERY = gql`
  query space($pk: Int) {
    spaceByPk(pk: $pk) {
      pk
      nameFi
      nameSv
      nameEn
      surfaceArea
      maxPersons
      code
      unit {
        pk
        nameFi
        descriptionFi
        location {
          addressStreetFi
          addressZip
          addressCityFi
        }
      }
      parent {
        pk
        nameFi
        parent {
          nameFi
          parent {
            nameFi
          }
        }
      }
    }
  }
`;

export const RESOURCE_QUERY = gql`
  query resource($pk: Int) {
    resourceByPk(pk: $pk) {
      pk
      nameFi
      nameSv
      nameEn
      descriptionFi
      descriptionEn
      descriptionSv
      space {
        pk
      }
    }
  }
`;

export const RESERVATIONS_QUERY = gql`
  query reservations($state: String) {
    reservations(state: $state) {
      edges {
        node {
          pk
          workingMemo
          state
          reservationUnits {
            nameFi
            unit {
              nameFi
            }
          }
          begin
          end
          reserveeFirstName
          reserveeLastName
          reserveeEmail
          name
          price
        }
      }
    }
  }
`;

export const HANDLING_COUNT_QUERY = gql`
  query handlingCount {
    reservations(state: "REQUIRES_HANDLING") {
      edges {
        node {
          pk
        }
      }
    }
  }
`;

export const RESERVATION_QUERY = gql`
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      pk
      workingMemo
      reservationUnits {
        nameFi
        unit {
          nameFi
        }
      }
      ageGroup {
        minimum
        maximum
      }
      purpose {
        nameFi
      }
      numPersons
      name
      price
      unitPrice
      description
      reserveeFirstName
      reserveeLastName
      reserveePhone
      begin
      end
      calendarUrl
      user
      state
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
    }
  }
`;

export const APPROVE_RESERVATION = gql`
  mutation approveReservation($input: ReservationApproveMutationInput!) {
    approveReservation(input: $input) {
      errors {
        field
        messages
      }
    }
  }
`;

export const DENY_RESERVATION = gql`
  mutation denyReservation($input: ReservationDenyMutationInput!) {
    denyReservation(input: $input) {
      errors {
        field
        messages
      }
    }
  }
`;

export const RESERVATION_DENY_REASONS = gql`
  query reservationDenyReasons {
    reservationDenyReasons {
      edges {
        node {
          pk
          reasonFi
        }
      }
    }
  }
`;

export const UPDATE_WORKING_MEMO = gql`
  mutation updateWorkingMemo($input: ReservationWorkingMemoMutationInput!) {
    updateReservationWorkingMemo(input: $input) {
      workingMemo
      errors {
        field
        messages
      }
    }
  }
`;
