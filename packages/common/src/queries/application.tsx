import { gql } from "@apollo/client";

export const APPLICANT_NAME_FRAGMENT = gql`
  fragment ApplicationName on ApplicationNode {
    applicantType
    organisation {
      id
      nameFi
      organisationType
    }
    contactPerson {
      id
      lastName
      firstName
    }
  }
`;

export const APPLICATION_SECTION_DURATION_FRAGMENT = gql`
  fragment ApplicationSectionDuration on ApplicationSectionNode {
    reservationsEndDate
    reservationsBeginDate
    appliedReservationsPerWeek
    reservationMinDuration
  }
`;

export const APPLICATION_SECTION_COMMON_FRAGMENT = gql`
  ${APPLICATION_SECTION_DURATION_FRAGMENT}
  fragment ApplicationSectionCommon on ApplicationSectionNode {
    id
    pk
    name
    status
    ...ApplicationSectionDuration
    reservationMaxDuration
    ageGroup {
      id
      pk
      minimum
      maximum
    }
    numPersons
    reservationUnitOptions {
      id
      pk
      preferredOrder
    }
  }
`;

export const APPLICATION_SECTION_UI_FRAGMENT = gql`
  ${APPLICATION_SECTION_COMMON_FRAGMENT}
  fragment ApplicationSectionUI on ApplicationSectionNode {
    ...ApplicationSectionCommon
    hasReservations
    suitableTimeRanges {
      id
      pk
      beginTime
      endTime
      dayOfTheWeek
      priority
    }
    purpose {
      id
      pk
      nameFi
      nameSv
      nameEn
    }
    reservationUnitOptions {
      id
      reservationUnit {
        id
        pk
        nameFi
        nameEn
        nameSv
        unit {
          id
          pk
          nameFi
          nameEn
          nameSv
        }
        applicationRoundTimeSlots {
          id
          weekday
          closed
          reservableTimes {
            begin
            end
          }
        }
      }
    }
  }
`;

export const APPLICANT_FRAGMENT = gql`
  fragment Applicant on ApplicationNode {
    applicantType
    contactPerson {
      id
      pk
      firstName
      lastName
      email
      phoneNumber
    }
    additionalInformation
    organisation {
      id
      pk
      nameFi
      identifier
      organisationType
      coreBusinessFi
      yearEstablished
      address {
        id
        pk
        postCode
        streetAddressFi
        cityFi
      }
    }
    homeCity {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    billingAddress {
      id
      pk
      postCode
      streetAddressFi
      cityFi
    }
  }
`;
