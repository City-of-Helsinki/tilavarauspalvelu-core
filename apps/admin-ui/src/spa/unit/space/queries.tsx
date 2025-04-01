import { gql } from "@apollo/client";

export const CREATE_SPACE = gql`
  mutation CreateSpace($input: SpaceCreateMutationInput!) {
    createSpace(input: $input) {
      pk
    }
  }
`;

export const UPDATE_SPACE = gql`
  mutation UpdateSpace($input: SpaceUpdateMutationInput!) {
    updateSpace(input: $input) {
      pk
    }
  }
`;

export const SPACE_HIERARCHY_QUERY = gql`
  query UnitSpaces($id: ID!) {
    unit(id: $id) {
      id
      spaces {
        id
        pk
        nameFi
        parent {
          id
          pk
        }
      }
    }
  }
`;

export const SPACE_COMMON_FRAGMENT = gql`
  fragment SpaceCommonFields on SpaceNode {
    id
    pk
    nameFi
    parent {
      id
      pk
      nameFi
    }
    surfaceArea
    maxPersons
  }
`;

// TODO why does this query parents up the tree?
export const SPACE_QUERY = gql`
  query Space($id: ID!) {
    space(id: $id) {
      ...SpaceCommonFields
      nameSv
      nameEn
      code
      unit {
        id
        pk
        nameFi
        descriptionFi
        location {
          ...LocationFields
        }
        spaces {
          id
          pk
          nameFi
        }
      }
      parent {
        id
        parent {
          id
          nameFi
          parent {
            id
            nameFi
          }
        }
      }
    }
  }
`;
