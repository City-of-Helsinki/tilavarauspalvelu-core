import { gql } from "@apollo/client";

export const CREATE_RESOURCE = gql`
  mutation createResource($input: ResourceCreateMutationInput!) {
    createResource(input: $input) {
      pk
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation updateResource($input: ResourceUpdateMutationInput!) {
    updateResource(input: $input) {
      pk
    }
  }
`;

export const RESOURCE_QUERY = gql`
  query Resource($id: ID!) {
    resource(id: $id) {
      id
      pk
      nameFi
      nameSv
      nameEn
      space {
        id
        pk
      }
    }
  }
`;
