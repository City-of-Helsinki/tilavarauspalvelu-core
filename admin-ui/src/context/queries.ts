import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      isSuperuser
      unitRoles {
        pk
      }
      serviceSectorRoles {
        pk
      }
      generalRoles {
        pk
      }
    }
  }
`;
