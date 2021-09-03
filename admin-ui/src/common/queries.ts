import { gql } from "@apollo/client";

export const SPACES_QUERY = gql`
  query getSpaces {
    spaces {
      edges {
        node {
          id: pk
          name
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
          # maxPersons
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
          id: pk
          name
          locationType
          space {
            name
            building {
              name
              district {
                name
              }
            }
          }
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

export const UNITS_QUERY = gql`
  query units {
    units {
      edges {
        node {
          name
          pk
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
      name
    }
  }
`;

// WIP, no api yet
export const CREATE_RESOURCE = gql`
  mutation createResource($input: ResourceCreateMutationInput!) {
    createSpace(input: $input) {
      id
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
      errors {
        field
        messages
      }
    }
  }
`;
