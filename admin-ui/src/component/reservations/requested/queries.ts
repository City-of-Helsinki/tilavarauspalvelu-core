import { gql } from "@apollo/client";

export const UPDATE_WORKING_MEMO = gql`
  mutation updateWorkingMemo($input: ReservationWorkingMemoMutationInput!) {
    updateReservationWorkingMemo(input: $input) {
      workingMemo
      errors {
        field
        messages
      }
    }
  }
`;

export const GET_BIRTHDATE_BY_RESERVATION_PK = gql`
  query reservationUserBirthDate($pk: Int) {
    reservationByPk(pk: $pk) {
      user {
        dateOfBirth
      }
    }
  }
`;

export const RESERVATION_QUERY = gql`
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      pk
      createdAt
      workingMemo
      reservationUnits {
        pk
        nameFi
        unit {
          pk
          nameFi
          serviceSectors {
            pk
          }
        }
        pricings {
          begins
          pricingType
          priceUnit
          lowestPrice
          highestPrice
          taxPercentage {
            value
          }
          status
        }
      }
      recurringReservation {
        pk
        beginDate
        endDate
        weekdays
      }
      ageGroup {
        minimum
        maximum
      }
      purpose {
        nameFi
      }
      homeCity {
        nameFi
      }
      price
      taxPercentageValue
      numPersons
      reserveeType
      reserveeIsUnregisteredAssociation
      name
      description
      reserveeFirstName
      reserveeLastName
      reserveePhone
      begin
      end
      calendarUrl
      user {
        firstName
        lastName
        email
        pk
      }
      state
      reserveeOrganisationName
      reserveeEmail
      reserveeId
      reserveeIsUnregisteredAssociation
      reserveeAddressStreet
      reserveeAddressCity
      reserveeAddressZip
      billingFirstName
      billingLastName
      billingPhone
      billingEmail
      billingAddressStreet
      billingAddressCity
      billingAddressZip
      freeOfChargeReason
      applyingForFreeOfCharge
      orderUuid
      orderStatus
      refundUuid
    }
  }
`;

export const APPROVE_RESERVATION = gql`
  mutation approveReservation($input: ReservationApproveMutationInput!) {
    approveReservation(input: $input) {
      pk
      state
      errors {
        field
        messages
      }
    }
  }
`;

export const DENY_RESERVATION = gql`
  mutation denyReservation($input: ReservationDenyMutationInput!) {
    denyReservation(input: $input) {
      pk
      state
      errors {
        field
        messages
      }
    }
  }
`;

export const REFUND_RESERVATION = gql`
  mutation refundReservation($input: ReservationRefundMutationInput!) {
    refundReservation(input: $input) {
      errors {
        field
        messages
      }
    }
  }
`;

export const REQUIRE_HANDLING_RESERVATION = gql`
  mutation requireHandling($input: ReservationRequiresHandlingMutationInput!) {
    requireHandlingForReservation(input: $input) {
      pk
      state
      errors {
        field
        messages
      }
    }
  }
`;

export const RESERVATION_DENY_REASONS = gql`
  query reservationDenyReasons {
    reservationDenyReasons {
      edges {
        node {
          pk
          reasonFi
        }
      }
    }
  }
`;
