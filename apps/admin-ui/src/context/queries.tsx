import { gql } from "@apollo/client";

export const CURRENT_USER = gql`
  query CurrentUser {
    currentUser {
      id
      username
      firstName
      lastName
      email
      isSuperuser
      pk
      unitRoles {
        id
        pk
        role {
          id
          code
          verboseNameFi
          permissions {
            id
            permission
          }
        }
        unit {
          id
          pk
          nameFi
        }
        unitGroup {
          id
          units {
            id
            pk
            nameFi
          }
        }
      }
      generalRoles {
        id
        pk
        role {
          id
          code
          verboseNameFi
          permissions {
            id
            permission
          }
        }
      }
    }
  }
`;
