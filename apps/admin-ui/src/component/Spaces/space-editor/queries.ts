import { gql } from "@apollo/client";
import { SPACE_COMMON_FRAGMENT } from "@/common/fragments";
import { LOCATION_FRAGMENT } from "common/src/queries/fragments";

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

// TODO why does this query parents up the tree?
export const SPACE_QUERY = gql`
  ${SPACE_COMMON_FRAGMENT}
  ${LOCATION_FRAGMENT}
  query space($pk: Int) {
    spaceByPk(pk: $pk) {
      ...SpaceCommonFields
      nameSv
      nameEn
      code
      unit {
        pk
        nameFi
        descriptionFi
        location {
          ...LocationFields
        }
      }
      parent {
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
