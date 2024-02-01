import { gql } from "@apollo/client";
import { ReservationsReservationTypeChoices } from "common/types/gql-types";
import {
  IMAGE_FRAGMENT,
  PRICING_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
  UNIT_NAME_FRAGMENT,
} from "./fragments";

const RESERVEE_NAME_FRAGMENT = gql`
  fragment ReserveeNameFields on ReservationType {
    reserveeFirstName
    reserveeLastName
    reserveeEmail
    reserveePhone
    reserveeType
    reserveeOrganisationName
  }
`;

export const CREATE_RESERVATION = gql`
  mutation createReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
      price
      errors {
        field
        messages
      }
    }
  }
`;

export const UPDATE_RESERVATION = gql`
  ${RESERVEE_NAME_FRAGMENT}
  mutation updateReservation($input: ReservationUpdateMutationInput!) {
    updateReservation(input: $input) {
      reservation {
        pk
        calendarUrl
        state
        user {
          email
        }
        name
        description
        purpose {
          pk
        }
        numPersons
        ageGroup {
          pk
        }
        ...ReserveeNameFields
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
        homeCity {
          pk
        }
        applyingForFreeOfCharge
        freeOfChargeReason
      }
      errors {
        field
        messages
      }
    }
  }
`;

export const DELETE_RESERVATION = gql`
  mutation deleteReservation($input: ReservationDeleteMutationInput!) {
    deleteReservation(input: $input) {
      deleted
      errors
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation cancelReservation($input: ReservationCancellationMutationInput!) {
    cancelReservation(input: $input) {
      pk
      cancelReasonPk
      cancelDetails
      state
      clientMutationId
      errors {
        field
        messages
      }
    }
  }
`;

export const CONFIRM_RESERVATION = gql`
  mutation confirmReservation($input: ReservationConfirmMutationInput!) {
    confirmReservation(input: $input) {
      pk
      state
      order {
        id
        pk
        checkoutUrl
        receiptUrl
      }
      errors {
        field
        messages
      }
    }
  }
`;

const CANCELLATION_RULE_FRAGMENT = gql`
  fragment CancellationRuleFields on ReservationUnitType {
    cancellationRule {
      canBeCancelledTimeBefore
      needsHandling
    }
  }
`;

// NOTE hard coded NORMAL type so only ment to be used in client ui.
// reservationType valid values: "normal", "behalf", "staff", "blocked"
// even though the ReservationsReservationTypeChoices says they are uppercase
// NOTE bang user ID so this doesn't get abused (don't use it without a user)
export const LIST_RESERVATIONS = gql`
  ${PRICING_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${UNIT_NAME_FRAGMENT}
  ${CANCELLATION_RULE_FRAGMENT}
  query listReservations(
    $before: String
    $after: String
    $first: Int
    $last: Int
    $begin: DateTime
    $end: DateTime
    $state: [String]
    $user: ID!
    $reservationUnit: [ID]
    $orderBy: String
  ) {
    reservations(
      before: $before
      after: $after
      first: $first
      last: $last
      begin: $begin
      end: $end
      state: $state
      user: $user
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      reservationType: "${ReservationsReservationTypeChoices.Normal.toLowerCase()}"
    ) {
      edges {
        node {
          pk
          name
          begin
          end
          state
          price
          bufferTimeBefore
          bufferTimeAfter
          orderUuid
          isBlocked
          reservationUnits {
            pk
            nameFi
            nameEn
            nameSv
            unit {
              ...UnitNameFields
            }
            ...CancellationRuleFields
            images {
              ...ImageFields
            }
            pricings {
              ...PricingFields
            }
          }
        }
      }
    }
  }
`;

export const GET_RESERVATION = gql`
  ${RESERVATION_UNIT_FRAGMENT}
  ${CANCELLATION_RULE_FRAGMENT}
  ${RESERVEE_NAME_FRAGMENT}
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      pk
      name
      ...ReserveeNameFields
      description
      reserveeId
      begin
      end
      calendarUrl
      user {
        email
      }
      state
      price
      priceNet
      taxPercentageValue
      orderStatus
      orderUuid
      reservationUnits {
        ...ReservationUnitFields
        ...CancellationRuleFields
      }
      purpose {
        pk
        nameFi
        nameEn
        nameSv
      }
      ageGroup {
        pk
        minimum
        maximum
      }
      homeCity {
        pk
        name
      }
      numPersons
      isHandled
    }
  }
`;

export const GET_RESERVATION_CANCEL_REASONS = gql`
  query getReservationCancelReasons {
    reservationCancelReasons {
      edges {
        node {
          pk
          reasonFi
          reasonEn
          reasonSv
        }
      }
    }
  }
`;

export const GET_CITIES = gql`
  query getCities {
    cities {
      edges {
        node {
          pk
          name
          nameFi
          nameEn
          nameSv
        }
      }
    }
  }
`;

export const ADJUST_RESERVATION_TIME = gql`
  mutation adjustReservationTime($input: ReservationAdjustTimeMutationInput!) {
    adjustReservationTime(input: $input) {
      pk
      state
      begin
      end
      errors {
        field
        messages
      }
    }
  }
`;

export const GET_ORDER = gql`
  query order($orderUuid: String!) {
    order(orderUuid: $orderUuid) {
      reservationPk
      status
      paymentType
      receiptUrl
      checkoutUrl
    }
  }
`;

export const REFRESH_ORDER = gql`
  mutation refreshOrder($input: RefreshOrderMutationInput!) {
    refreshOrder(input: $input) {
      orderUuid
      status
    }
  }
`;
