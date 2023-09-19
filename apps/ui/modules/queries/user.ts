import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query getCurrentUser {
    currentUser {
      pk
      firstName
      lastName
      email
    }
  }
`;

export const CURRENT_USER_GLOBAL = gql`
  query getCurrentUserGlobal {
    currentUser {
      pk
      firstName
      lastName
      email
    }
  }
`;
