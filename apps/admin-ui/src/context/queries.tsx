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
        unit {
          pk
          nameFi
        }
        unitGroup {
          units {
            pk
            nameFi
          }
        }
        role {
          permissions {
            permission
          }
        }
      }
      serviceSectorRoles {
        pk
        serviceSector {
          pk
          nameFi
        }
        role {
          permissions {
            permission
          }
        }
      }
      generalRoles {
        pk
        role {
          code
          verboseNameFi
        }
        role {
          permissions {
            permission
          }
        }
      }
    }
  }
`;
