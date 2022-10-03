import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query getCurrentUser {
    currentUser {
      pk
      firstName
      lastName
    }
  }
`;
