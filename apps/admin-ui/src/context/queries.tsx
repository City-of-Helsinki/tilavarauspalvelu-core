import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      username
      firstName
      lastName
      email
      isSuperuser
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
        unitGroups {
          units {
            pk
            nameFi
          }
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
