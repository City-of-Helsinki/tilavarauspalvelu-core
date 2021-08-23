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
