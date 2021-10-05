import { gql } from "@apollo/client";

export const SPACES_QUERY = gql`
  query getSpaces {
    spaces {
      edges {
        node {
          pk
          name
          unit {
            pk
          }
          building {
            name
            district {
              name
            }
          }
          parent {
            name
            building {
              name
              district {
                name
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
          name
          locationType
          space {
            name
            unit {
              name
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
          name
          unit {
            name
          }
          reservationUnitType {
            name
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
          name
          unit {
            name
          }
          reservationUnitType {
            name
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
      id
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
      id
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
          name
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
          name
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
      name
      tprekId
      shortDescription
      reservationUnits {
        pk
        name
        maxPersons
        surfaceArea
        purposes {
          pk
          name
        }
        reservationUnitType {
          pk
          name
        }
        images {
          imageType
          mediumUrl
        }
      }
      spaces {
        pk
        name
        maxPersons
        surfaceArea
        resources {
          pk
          name
          space {
            unit {
              name
            }
          }
        }
      }
      location {
        addressStreet
        addressZip
        addressCity
        longitude
        latitude
      }
      name
    }
  }
`;

export const UNIT_WITH_SPACES_AND_RESOURCES = gql`
  query unit($pk: Int) {
    unitByPk(pk: $pk) {
      pk
      name
      spaces {
        pk
        name
        maxPersons
        surfaceArea
        resources {
          pk
          name
        }
      }
      location {
        addressStreet
        addressZip
        addressCity
      }
    }
  }
`;

export const RESERVATION_UNIT_EDITOR_PARAMETERS = gql`
  query reservation_unit_editor_parameters {
    equipments {
      edges {
        node {
          name
          pk
        }
      }
    }
  }
`;

// WIP, incomplete
export const RESERVATIONUNIT_QUERY = gql`
  query reservationUnit($pk: Int) {
    reservationUnitByPk(pk: $pk) {
      name
      description
      spaces {
        pk
        name
      }
      resources {
        pk
        name
      }
      services {
        pk
        name
      }
      purposes {
        pk
        name
      }
      reservationUnitType {
        pk
        name
      }
      requireIntroduction
      termsOfUse
      contactInformation
      maxReservationDuration
      minReservationDuration
      images {
        imageType
        imageUrl
      }
      pk
      location {
        addressStreet
        addressZip
        addressCity
        longitude
        latitude
      }
      equipment {
        pk
        name
      }
      unit {
        pk
      }
      maxPersons
      surfaceArea
    }
  }
`;

// WIP api incomplete
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

// WIP api incomplete
export const CREATE_RESERVATION_UNIT = gql`
  mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
    createReservationUnit(input: $input) {
      id
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

// WIP, no api yet
export const DELETE_RESOURCE = gql`
  mutation deleteResource($input: ResourceDeleteMutationInput!) {
    deleteResource(input: $input) {
      deleted
      errors
    }
  }
`;

export const SPACE_QUERY = gql`
  query space($pk: Int) {
    spaceByPk(pk: $pk) {
      pk
      name
      surfaceArea
      maxPersons
      code
      termsOfUse
      unit {
        pk
        name
        description
        location {
          addressStreet
          addressZip
          addressCity
        }
      }
      parent {
        pk
        name
        parent {
          name
          parent {
            name
          }
        }
      }
    }
  }
`;
