import { gql } from "@apollo/client";

export const GET_BIRTHDATE_BY_APPLICATION_PK = gql`
  query applicationUserBirthDate($pk: [ID]) {
    applications(pk: $pk) {
      edges {
        node {
          applicantUser {
            dateOfBirth
          }
        }
      }
    }
  }
`;
