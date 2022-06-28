import { gql } from "@apollo/client";

export const APPLICATION_ROUNDS_QUERY = gql`
  query applicationRounds {
    applicationRounds {
      edges {
        node {
          serviceSector {
            pk
            nameFi
          }
          pk
          nameFi
          applicationPeriodBegin
          applicationPeriodEnd
          reservationPeriodBegin
          reservationPeriodEnd
          status
          applicationsCount
          reservationUnitCount
          statusTimestamp
        }
      }
    }
  }
`;

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
              reservationUnit {
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
