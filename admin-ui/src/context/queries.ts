import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      isSuperuser
      username
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
