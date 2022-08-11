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
            nameFi
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

export const DELETE_RESOURCE = gql`
  mutation deleteResource($input: ResourceDeleteMutationInput!) {
    deleteResource(input: $input) {
      deleted
      errors
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
