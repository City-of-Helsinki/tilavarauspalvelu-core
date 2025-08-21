import { gql } from "@apollo/client";

export const ACCESS_CODE = gql`
  query AccessCode($id: ID!) {
    node(id: $id) {
      ... on ReservationNode {
        id
        pindoraInfo {
          ...PindoraReservation
        }
      }
    }
  }
`;
