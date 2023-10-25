import { gql } from "@apollo/client";

export { APPLICATION_QUERY } from "common/src/queries/application";

export const GET_BIRTHDATE_BY_APPLICATION_PK = gql`
  query applicationUserBirthDate($pk: [Int]) {
    applications(pk: $pk) {
      edges {
        node {
          applicant {
            dateOfBirth
          }
        }
      }
    }
  }
`;
