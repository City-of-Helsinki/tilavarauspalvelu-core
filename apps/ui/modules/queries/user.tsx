import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query GetCurrentUser {
    currentUser {
      pk
      firstName
      lastName
      email
      isAdAuthenticated
    }
  }
`;
