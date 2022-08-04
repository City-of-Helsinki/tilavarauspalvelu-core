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

export const APPLICATIONS_BY_APPLICATION_ROUND_QUERY = gql`
  query getApplicationsByPk($applicationRound: ID) {
    applications(applicationRound: $applicationRound) {
      edges {
        node {
          pk
          status
          applicantName
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
            applicationEventSchedules {
              pk
              priority
              day
              begin
              end
              applicationEventScheduleResult {
                pk
                accepted
                declined
                allocatedReservationUnit {
                  pk
                }
                allocatedDay
                allocatedBegin
                allocatedEnd
              }
            }
          }
        }
      }
    }
  }
`;

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
