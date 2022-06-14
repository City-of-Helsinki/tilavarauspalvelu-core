import { gql } from "@apollo/client";

export const APPLICATIONS_QUERY = gql`
  query getApplications {
    applications(status: "in_review") {
      edges {
        node {
          pk
          status
          contactPerson {
            firstName
            lastName
          }

          organisation {
            name
            organisationType
          }
          applicationEvents {
            eventsPerWeek
            minDuration
            name
            eventReservationUnits {
              priority
              reservationUnitDetails {
                unit {
                  nameFi
                }
              }
            }
          }
        }
      }
    }
  }
`;
