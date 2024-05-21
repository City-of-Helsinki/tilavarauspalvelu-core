import { gql } from "@apollo/client";
import { SPACE_COMMON_FRAGMENT } from "@/common/fragments";
import { LOCATION_FRAGMENT } from "common/src/queries/fragments";

export const CREATE_SPACE = gql`
  mutation createSpace($input: SpaceCreateMutationInput!) {
    createSpace(input: $input) {
      pk
    }
  }
`;

export const UPDATE_SPACE = gql`
  mutation updateSpace($input: SpaceUpdateMutationInput!) {
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

// TODO why does this query parents up the tree?
export const SPACE_QUERY = gql`
  ${SPACE_COMMON_FRAGMENT}
  ${LOCATION_FRAGMENT}
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
