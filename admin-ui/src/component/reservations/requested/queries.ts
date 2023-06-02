import { gql } from "@apollo/client";
import { RESERVATION_META_FRAGMENT } from "../fragments";

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
  ${RESERVATION_META_FRAGMENT}
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      pk
      createdAt
      workingMemo
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
      price
      taxPercentageValue
      orderStatus
      orderUuid
      refundUuid
      ...ReservationMetaFields
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
