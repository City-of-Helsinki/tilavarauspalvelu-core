import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      isSuperuser
      unitRoles {
        pk

        role {
          code
        }
        units {
          pk
        }
      }
      serviceSectorRoles {
        pk
        role {
          code
        }
        serviceSector {
          pk
        }
      }
      generalRoles {
        pk
        role {
          code
        }
        pk
      }
    }
  }
`;
