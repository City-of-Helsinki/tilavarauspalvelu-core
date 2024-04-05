import { gql } from "@apollo/client";
import { Type } from "common/types/gql-types";
import {
  RESERVEE_NAME_FRAGMENT,
  RESERVEE_BILLING_FRAGMENT,
  IMAGE_FRAGMENT,
  PRICING_FRAGMENT,
} from "common/src/queries/fragments";
import {
  RESERVATION_UNIT_FRAGMENT,
  UNIT_NAME_FRAGMENT_I18N,
} from "./fragments";

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
  ${RESERVEE_BILLING_FRAGMENT}
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
        ...ReserveeBillingFields
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
  mutation DeleteReservation($input: ReservationDeleteMutationInput!) {
    deleteReservation(input: $input) {
      deleted
      errors
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation CancelReservation($input: ReservationCancellationMutationInput!) {
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
  mutation ConfirmReservation($input: ReservationConfirmMutationInput!) {
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
  ${UNIT_NAME_FRAGMENT_I18N}
  ${CANCELLATION_RULE_FRAGMENT}
  query Reservations(
    $before: String
    $after: String
    $first: Int
    $last: Int
    $beginDate: Date
    $endDate: Date
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
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      user: $user
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      reservationType: "${Type.Normal.toLowerCase()}"
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
          order {
            orderUuid
          }
          isBlocked
          reservationUnits {
            pk
            nameFi
            nameEn
            nameSv
            unit {
              ...UnitNameFieldsI18N
            }
            ...CancellationRuleFields
            images {
              ...ImageFragment
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
  ${IMAGE_FRAGMENT}
  ${RESERVATION_UNIT_FRAGMENT}
  ${CANCELLATION_RULE_FRAGMENT}
  ${RESERVEE_NAME_FRAGMENT}
  query Reservation($id: ID!) {
    reservation(id: $id) {
      pk
      name
      ...ReserveeNameFields
      description
      reserveeId
      bufferTimeBefore
      bufferTimeAfter
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
      order {
        orderUuid
        status
      }
      reservationUnits {
        pk
        nameFi
        nameEn
        nameSv
        reservationPendingInstructionsFi
        reservationPendingInstructionsEn
        reservationPendingInstructionsSv
        reservationConfirmedInstructionsFi
        reservationConfirmedInstructionsEn
        reservationConfirmedInstructionsSv
        reservationCancelledInstructionsFi
        reservationCancelledInstructionsEn
        reservationCancelledInstructionsSv
        termsOfUseFi
        termsOfUseEn
        termsOfUseSv
        serviceSpecificTerms {
          textFi
          textEn
          textSv
        }
        cancellationTerms {
          textFi
          textEn
          textSv
        }
        paymentTerms {
          textFi
          textEn
          textSv
        }
        pricingTerms {
          textFi
          textEn
          textSv
        }
        unit {
          pk
          tprekId
          nameFi
          nameEn
          nameSv
          location {
            latitude
            longitude
            addressStreetFi
            addressStreetEn
            addressStreetSv
            addressZip
            addressCityFi
            addressCityEn
            addressCitySv
          }
        }
        cancellationRule {
          canBeCancelledTimeBefore
          needsHandling
        }
        spaces {
          pk
          nameFi
          nameEn
          nameSv
        }
        images {
          ...ImageFragment
        }
        pricings {
          begins
          priceUnit
          pricingType
          lowestPrice
          highestPrice
          taxPercentage {
            value
          }
          status
        }
        minPersons
        maxPersons
        metadataSet {
          id
          name
          pk
          supportedFields
          requiredFields
        }
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

// TODO combine these into params query (similarly to as in admin-ui)
// where are they even used?
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
