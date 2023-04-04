import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      username
      firstName
      lastName
      isSuperuser
      username
      pk
      unitRoles {
        pk
        role {
          code
          verboseNameFi
        }
        units {
          pk
          nameFi
        }
        permissions {
          permission
        }
      }
      serviceSectorRoles {
        pk
        serviceSector {
          pk
          nameFi
        }
        permissions {
          permission
        }
      }
      generalRoles {
        pk
        role {
          code
          verboseNameFi
        }
        permissions {
          permission
        }
      }
    }
  }
`;
