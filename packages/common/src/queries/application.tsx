import { gql } from "@apollo/client";

export const APPLICANT_NAME_FRAGMENT = gql`
  fragment ApplicationName on ApplicationNode {
    id
    applicantType
    organisation {
      id
      nameTranslations {
        fi
      }
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
    id
    reservationsEndDate
    reservationsBeginDate
    appliedReservationsPerWeek
    reservationMinDuration
  }
`;

// TODO don't use convenience fragments
export const APPLICATION_SECTION_COMMON_FRAGMENT = gql`
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

export const SUITABLE_TIME_FRAGMENT = gql`
  fragment SuitableTime on SuitableTimeRangeNode {
    id
    pk
    beginTime
    endTime
    dayOfTheWeek
    priority
  }
`;

export const APPLICANT_FRAGMENT = gql`
  fragment Applicant on ApplicationNode {
    id
    pk
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
      nameTranslations {
        fi
      }
      identifier
      organisationType
      coreBusinessTranslations {
        fi
      }
      yearEstablished
      address {
        ...AddressFields
      }
    }
    homeCity {
      id
      pk
      nameTranslations {
        fi
        en
        sv
      }
    }
    billingAddress {
      ...AddressFields
    }
  }
`;

export const ADDRESS_FRAGMENT = gql`
  fragment AddressFields on AddressNode {
    id
    pk
    postCode
    streetAddressTranslations {
      fi
    }
    cityTranslations {
      fi
    }
  }
`;
