import { gql } from "@apollo/client";
import { IMAGE_FRAGMENT, TERMS_OF_USE_FRAGMENT } from "./fragments";

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

export const APPLICATION_SECTION_DURATION_FRAGMENT = gql`
  fragment ApplicationSectionDurationFragment on ApplicationSectionNode {
    reservationsEndDate
    reservationsBeginDate
    appliedReservationsPerWeek
    reservationMinDuration
  }
`;

const APPLICATION_SECTION_COMMON_FRAGMENT = gql`
  ${APPLICATION_SECTION_DURATION_FRAGMENT}
  fragment ApplicationSectionCommonFragment on ApplicationSectionNode {
    pk
    name
    status
    ...ApplicationSectionDurationFragment
    reservationMaxDuration
    ageGroup {
      pk
      minimum
      maximum
    }
    numPersons
    reservationUnitOptions {
      pk
      preferredOrder
    }
  }
`;

// NOTE this is for allocation only (it includes the application name)
// for regular application queries we don't need to query the name through the application relation
export const APPLICATION_SECTION_ADMIN_FRAGMENT = gql`
  ${APPLICANT_NAME_FRAGMENT}
  ${APPLICATION_SECTION_COMMON_FRAGMENT}
  fragment ApplicationSectionFragment on ApplicationSectionNode {
    ...ApplicationSectionCommonFragment
    purpose {
      pk
      nameFi
    }
    application {
      pk
      status
      ...ApplicationNameFragment
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
          weekday
          reservableTimes {
            begin
            end
          }
        }
      }
    }
  }
`;

const APPLICANT_FRAGMENT = gql`
  fragment ApplicantFragment on ApplicationNode {
    applicantType
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
    user {
      name
      email
      pk
    }
  }
`;

const APPLICATION_ROUND_FRAGMENT = gql`
  ${IMAGE_FRAGMENT}
  fragment ApplicationRoundFragment on ApplicationRoundNode {
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
`;

// TODO what does admin side require from UIFragment?
export const APPLICATION_ADMIN_FRAGMENT = gql`
  ${APPLICANT_FRAGMENT}
  ${APPLICATION_SECTION_UI_FRAGMENT}
  fragment ApplicationAdminFragment on ApplicationNode {
    pk
    id
    status
    lastModifiedDate
    ...ApplicantFragment
    applicationRound {
      pk
      nameFi
    }
    applicationSections {
      ...ApplicationSectionUIFragment
      allocations
      reservationUnitOptions {
        rejected
        allocatedTimeSlots {
          pk
          id
        }
      }
    }
  }
`;

export const APPLICATION_FRAGMENT = gql`
  ${APPLICATION_SECTION_UI_FRAGMENT}
  ${APPLICANT_FRAGMENT}
  ${APPLICATION_ROUND_FRAGMENT}
  fragment ApplicationCommon on ApplicationNode {
    pk
    status
    lastModifiedDate
    ...ApplicantFragment
    applicationRound {
      ...ApplicationRoundFragment
    }
    applicationSections {
      ...ApplicationSectionUIFragment
    }
  }
`;

/// NOTE Requires higher backend optimizer complexity limit (22 works, lower doesn't)
export const APPLICATION_QUERY = gql`
  ${APPLICATION_FRAGMENT}
  ${TERMS_OF_USE_FRAGMENT}
  query getApplication($id: ID!) {
    application(id: $id) {
      ...ApplicationCommon
      applicationRound {
        termsOfUse {
          ...TermsOfUseFields
        }
      }
    }
  }
`;
