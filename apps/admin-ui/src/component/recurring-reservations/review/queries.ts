import { gql } from "@apollo/client";
import { ApplicationStatusChoice } from "common/types/gql-types";

// TODO is the status correct? and it's just a singular (the backend doesn't allow an array)
export const APPLICATIONS_QUERY = gql`
  query getApplications(
    $offset: Int
    $first: Int
    $applicationRound: Int
    $unit: [Int]
  ) {
    applications(
      first: $first
      offset: $offset
      unit: $unit
      applicationRound: $applicationRound
      status: [
        ${ApplicationStatusChoice.Received},
        ${ApplicationStatusChoice.InAllocation},
        ${ApplicationStatusChoice.Handled},
        ${ApplicationStatusChoice.ResultsSent},
      ]
    ) {
      edges {
        node {
          pk
          status
          applicantType
          contactPerson {
            firstName
            lastName
          }
          organisation {
            name
            organisationType
          }
          applicationEvents {
            name
            pk
            eventReservationUnits {
              preferredOrder
              reservationUnit {
                unit {
                  pk
                  nameFi
                }
              }
            }
          }
        }
      }
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

// TODO is the status correct here? (also rename the query if you hard code the status)
// This used to be the old status, but it doesn't return anything for some rounds
// applicationStatus: ${ApplicationStatusChoice.Received}
// there is no option to pass array to this filter in GQL api
export const APPLICATIONS_EVENTS_QUERY = gql`
  query getApplicationEvents(
    $offset: Int
    $first: Int
    $applicationRound: Int
    $unit: [Int]
  ) {
    applicationEvents(
      first: $first
      offset: $offset
      unit: $unit
      applicationRound: $applicationRound
    ) {
      edges {
        node {
          pk
          name
          status
          begin
          end
          biweekly
          eventsPerWeek
          minDuration
          application {
            pk
            status
            applicantType
            contactPerson {
              firstName
              lastName
            }
            organisation {
              name
              organisationType
            }
          }
          eventReservationUnits {
            preferredOrder
            reservationUnit {
              unit {
                pk
                nameFi
              }
            }
          }
        }
      }
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;
