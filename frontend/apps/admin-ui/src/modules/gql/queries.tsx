import { gql } from "@apollo/client";

export const GET_RESERVATION_PERMISSION_QUERY = gql`
  query ReservationPermissions($id: ID!) {
    reservation(id: $id) {
      id
      reservationUnit {
        id
        unit {
          id
          pk
        }
      }
    }
  }
`;
