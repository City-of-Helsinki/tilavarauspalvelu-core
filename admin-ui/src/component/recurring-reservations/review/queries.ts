import { gql } from "@apollo/client";

export const APPLICATIONS_QUERY = gql`
  query getApplications(
    $offset: Int
    $first: Int
    $applicationRound: ID
    $unit: [ID]
  ) {
    applications(
      first: $first
      offset: $offset
      unit: $unit
      applicationRound: $applicationRound
      status: "in_review"
    ) {
      edges {
        node {
          pk
          status
          applicantType
          aggregatedData {
            appliedMinDurationTotal
            appliedReservationsTotal
          }
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
              priority
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
export const APPLICATIONS_EVENTS_QUERY = gql`
  query getApplicationEvents(
    $offset: Int
    $first: Int
    $applicationRound: ID
    $unit: [ID]
  ) {
    applicationEvents(
      first: $first
      offset: $offset
      unit: $unit
      applicationRound: $applicationRound
      applicationStatus: "in_review"
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
            priority
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
