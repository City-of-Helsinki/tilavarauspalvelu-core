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
          permissions {
            permission
          }
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
          permissions {
            permission
          }
        }
      }
    }
  }
`;
