import { gql } from "@apollo/client";

// TODO make into fragments and combine them with other queries
// a lot of things like name translations are only needed in the client side (not admin)
// also a lot of the deep hierarchy is only needed in the client side
export const APPLICATION_QUERY = gql`
  query getApplications($pk: [ID]) {
    applications(pk: $pk) {
      edges {
        node {
          pk
          status
          applicantType
          applicantEmail
          applicationRound {
            pk
            nameFi
            serviceSector {
              pk
              nameFi
            }
             reservationUnits {
              pk
              nameFi
              nameSv
              nameEn
              minPersons
              maxPersons
              images {
                imageType
                mediumUrl
              }
              unit {
                pk
                nameFi
                nameSv
                nameEn
              }
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
            pk
            firstName
            lastName
            email
            phoneNumber
          }
          additionalInformation
          organisation {
            pk
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
            pk
            nameFi
          }
          billingAddress {
            pk
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
            status
            eventsPerWeek
            minDuration
            maxDuration
            numPersons
            purpose {
              pk
              nameFi
            }
            ageGroup {
              pk
              minimum
              maximum
            }
            abilityGroup {
              pk
              name
            }
            applicationEventSchedules {
              pk
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
