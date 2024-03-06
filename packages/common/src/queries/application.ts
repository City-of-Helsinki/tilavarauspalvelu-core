import { gql } from "@apollo/client";
import { IMAGE_FRAGMENT } from "./fragments";
import { TERMS_OF_USE_FRAGMENT } from "./terms";

export const APPLICANT_NAME_FRAGMENT = gql`
  fragment ApplicationNameFragment on ApplicationNode {
    applicantType
    organisation {
      name
      organisationType
    }
    contactPerson {
      lastName
      firstName
    }
  }
`;

export const APPLICATION_DURATION_FRAGMENT = gql`
  fragment ApplicationDurationFragment on ApplicationSectionNode {
    reservationsEndDate
    reservationsBeginDate
    appliedReservationsPerWeek
    reservationMinDuration
  }
`;

const APPLICATION_SECTION_COMMON_FRAGMENT = gql`
  ${APPLICANT_NAME_FRAGMENT}
  ${APPLICATION_DURATION_FRAGMENT}
  fragment ApplicationSectionCommonFragment on ApplicationSectionNode {
    pk
    name
    status
    ...ApplicationDurationFragment
    reservationMaxDuration
    ageGroup {
      pk
      minimum
      maximum
    }
    numPersons
    application {
      pk
      status
      ...ApplicationNameFragment
    }
    reservationUnitOptions {
      pk
      preferredOrder
    }
  }
`;

// TODO on admin side we need to filter out the suitableTimeRanges with fulfilled
// TODO on admin side we don't need nameEn, nameSv for reservationUnit, unit, purpose
// TODO rename this to admin fragment
// TODO filter out unrelated reservationUnitOptions (we are always interested in a single reservationUnit)
export const APPLICATION_SECTION_FRAGMENT = gql`
  ${APPLICATION_SECTION_COMMON_FRAGMENT}
  fragment ApplicationSectionFragment on ApplicationSectionNode {
    ...ApplicationSectionCommonFragment
    purpose {
      pk
      nameFi
    }
    reservationUnitOptions {
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
`;

const APPLICATION_SECTION_UI_FRAGMENT = gql`
  ${APPLICATION_SECTION_COMMON_FRAGMENT}
  fragment ApplicationSectionUIFragment on ApplicationSectionNode {
    ...ApplicationSectionCommonFragment
    suitableTimeRanges {
      beginTime
      endTime
      dayOfTheWeek
      priority
    }
    purpose {
      pk
      nameFi
      nameSv
      nameEn
    }
    reservationUnitOptions {
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
        applicationRoundTimeSlots {
          reservableTimes {
            begin
            end
          }
        }
      }
    }
  }
`;

// TODO fragment this futher
// ex. admin side doesn't need nameEn / nameSv
// a lot of the deep hierarchy is only needed in the client side
// other uncommon fields ?
export const APPLICATION_FRAGMENT = gql`
  ${APPLICATION_SECTION_UI_FRAGMENT}
  ${IMAGE_FRAGMENT}
  fragment ApplicationCommon on ApplicationNode {
    pk
    status
    applicantType
    lastModifiedDate
    user {
      name
      email
      pk
    }
    applicationRound {
      pk
      nameFi
      nameSv
      nameEn
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
          ...ImageFragment
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
    applicationSections {
      ...ApplicationSectionUIFragment
    }
  }
`;

export const APPLICATION_QUERY = gql`
  ${APPLICATION_FRAGMENT}
  ${TERMS_OF_USE_FRAGMENT}
  query getApplication($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      applicationRound {
        termsOfUse {
          ...TermsOfUseFragment
        }
      }
    }
  }
`;
