import { gql } from "@apollo/client";

// TODO fragment this futher
// ex. admin side doesn't need nameEn / nameSv
// a lot of the deep hierarchy is only needed in the client side
// other uncommon fields ?
const APPLICATION_FRAGMENT = gql`
  fragment ApplicationCommon on ApplicationNode {
    pk
    status
    applicantType
    lastModifiedDate
    applicant {
      name
      email
      dateOfBirth
    }
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
        applicationRoundTimeSlots {
          reservableTimes {
            begin
            end
          }
        }
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
      nameEn
      nameSv
    }
    billingAddress {
      pk
      postCode
      streetAddress
      city
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
        nameSv
        nameEn
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
        preferredOrder
        reservationUnit {
          pk
          nameFi
          nameEn
          nameSv
          unit {
            pk
            nameFi
            nameEn
            nameSv
          }
        }
      }
    }
  }
`;

export const APPLICATION_ADMIN_QUERY = gql`
  ${APPLICATION_FRAGMENT}
  query getApplications($pk: [Int]) {
    applications(pk: $pk) {
      edges {
        node {
          ...ApplicationCommon
          workingMemo
        }
      }
    }
  }
`;

export const APPLICATION_QUERY = gql`
  ${APPLICATION_FRAGMENT}
  query getApplications($pk: [Int]) {
    applications(pk: $pk) {
      edges {
        node {
          ...ApplicationCommon
        }
      }
    }
  }
`;
