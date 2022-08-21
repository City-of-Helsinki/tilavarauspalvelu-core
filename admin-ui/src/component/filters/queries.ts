import { gql } from "@apollo/client";

export const RESERVATION_UNIT_TYPES_QUERY = gql`
  query reservationUnitTypes {
    reservationUnitTypes {
      edges {
        node {
          pk
          nameFi
        }
      }
    }
  }
`;
