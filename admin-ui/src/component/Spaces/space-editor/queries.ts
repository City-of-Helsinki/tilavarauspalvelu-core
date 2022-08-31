import { gql } from "@apollo/client";

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
  query unitSpaces($pk: Int) {
    unitByPk(pk: $pk) {
      spaces {
        pk
        nameFi
        parent {
          pk
        }
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
