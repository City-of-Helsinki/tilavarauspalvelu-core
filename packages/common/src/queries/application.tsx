import { gql } from "@apollo/client";

export const APPLICANT_NAME_FRAGMENT = gql`
  fragment ApplicationNameFields on ApplicationNode {
    id
    applicantType
    organisationName
    contactPersonFirstName
    contactPersonLastName
  }
`;

export const SUITABLE_TIME_FRAGMENT = gql`
  fragment SuitableTimeFields on SuitableTimeRangeNode {
    id
    pk
    beginTime
    endTime
    dayOfTheWeek
    priority
  }
`;

export const APPLICANT_FIELDS_FRAGMENT = gql`
  fragment ApplicantFields on ApplicationNode {
    id
    pk
    applicantType
    contactPersonFirstName
    contactPersonLastName
    contactPersonEmail
    contactPersonPhoneNumber
    additionalInformation
    organisationName
    organisationIdentifier
    organisationCoreBusiness
    organisationYearEstablished
    organisationPostCode
    organisationStreetAddress
    organisationCity
    billingPostCode
    billingStreetAddress
    billingCity
    municipality
  }
`;
