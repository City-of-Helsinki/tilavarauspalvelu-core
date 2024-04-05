import { gql } from "@apollo/client";

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

export const RESOURCE_QUERY = gql`
  query resource($pk: Int) {
    resourceByPk(pk: $pk) {
      pk
      nameFi
      nameSv
      nameEn
      space {
        pk
      }
    }
  }
`;
