import { gql } from "@apollo/client";
import { ApplicationStatusChoice } from "common/types/gql-types";

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

// TODO combine with APPLICATION_ROUNDS_QUERY
export const APPLICATION_ROUD_QUERY = gql`
  query ApplicationRoundCriteria($pk: [Int]!) {
    applicationRounds(pk: $pk) {
      edges {
        node {
          pk
          nameFi
          status
          applicationPeriodBegin
          applicationPeriodEnd
          reservationUnits {
            pk
          }
        }
      }
    }
  }
`;

export const APPLICATIONS_QUERY = gql`
  query getApplications {
    applications(status: ${ApplicationStatusChoice.Received}) {
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

export const APPLICATIONS_BY_APPLICATION_ROUND_QUERY = gql`
  query getApplicationsByPk($applicationRound: Int, $status: [String]) {
    applications(applicationRound: $applicationRound, status: $status) {
      edges {
        node {
          pk
          status
          applicant {
            name
          }
          applicantType
          contactPerson {
            firstName
            lastName
          }
          organisation {
            name
            organisationType
          }
          applicationRound {
            nameFi
          }
          applicationEvents {
            pk
            eventsPerWeek
            minDuration
            maxDuration
            eventsPerWeek
            name
            status
            declinedReservationUnits {
              pk
            }
            ageGroup {
              minimum
              maximum
            }
            eventReservationUnits {
              priority
              reservationUnit {
                pk
                nameFi
                unit {
                  pk
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

/* FIXME these were removed how to refactor???
export const CREATE_APPLICATION_EVENT_SCHEDULE_RESULT = gql`
  mutation createApplicationEventScheduleResult(
    $input: ApplicationEventScheduleResultCreateMutationInput!
  ) {
    createApplicationEventScheduleResult(input: $input) {
      applicationEventSchedule
      accepted
      declined
      allocatedReservationUnit
      allocatedDay
      allocatedBegin
      allocatedEnd
      errors {
        field
        messages
      }
    }
  }
`;

export const UPDATE_APPLICATION_EVENT_SCHEDULE_RESULT = gql`
  mutation ($input: ApplicationEventScheduleResultUpdateMutationInput!) {
    updateApplicationEventScheduleResult(input: $input) {
      applicationEventSchedule
      accepted
      declined
      allocatedReservationUnit
      allocatedDay
      allocatedBegin
      allocatedEnd
      errors {
        field
        messages
      }
    }
  }
`;
*/
