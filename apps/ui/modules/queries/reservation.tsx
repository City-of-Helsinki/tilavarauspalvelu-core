import { gql } from "@apollo/client";

export const ACCESS_CODE = gql`
  query AccessCode($id: ID!) {
    reservation(id: $id) {
      id
      pindoraInfo {
        ...PindoraReservation
      }
    }
  }
`;
