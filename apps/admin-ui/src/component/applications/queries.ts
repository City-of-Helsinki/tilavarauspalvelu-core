import { gql } from "@apollo/client";

export const GET_BIRTHDATE_BY_APPLICATION_PK = gql`
  query applicationUserBirthDate($pk: [ID]) {
    applications(pk: $pk) {
      edges {
        node {
          applicantUser {
            dateOfBirth
          }
        }
      }
    }
  }
`;

// TODO make into fragments and combine them with other queries
export const APPLICATION_QUERY = gql`
  query getApplications($pk: [ID]) {
    applications(pk: $pk) {
      edges {
        node {
          pk
          status
          applicantType
          applicationRound {
            pk
            nameFi
            serviceSector {
              pk
              nameFi
            }
            applicationPeriodBegin
            applicationPeriodEnd
            reservationPeriodBegin
            reservationPeriodEnd
            status
            applicationsCount
            reservationUnitCount
            statusTimestamp
          }
          contactPerson {
            firstName
            lastName
            email
            phoneNumber
          }
          additionalInformation
          organisation {
            name
            identifier
            organisationType
            coreBusiness
            address {
              postCode
              streetAddress
              city
            }
          }
          homeCity {
            nameFi
          }
          billingAddress {
            postCode
            streetAddress
            city
          }
          aggregatedData {
            appliedMinDurationTotal
            appliedReservationsTotal
          }
          applicationEvents {
            pk
            name
            begin
            end
            eventsPerWeek
            minDuration
            numPersons
            purpose {
              nameFi
            }
            ageGroup {
              pk
              minimum
              maximum
            }
            applicationEventSchedules {
              begin
              end
              day
              priority
            }
            eventReservationUnits {
              pk
              priority
              reservationUnit {
                pk
                nameFi
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
