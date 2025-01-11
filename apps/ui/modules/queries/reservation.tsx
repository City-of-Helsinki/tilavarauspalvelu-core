import { gql } from "@apollo/client";
import { IMAGE_FRAGMENT, PRICING_FRAGMENT } from "common/src/queries/fragments";
import { UNIT_NAME_FRAGMENT_I18N } from "./fragments";

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
      price
    }
  }
`;

export const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($input: ReservationUpdateMutationInput!) {
    updateReservation(input: $input) {
      pk
      state
    }
  }
`;

export const DELETE_RESERVATION = gql`
  mutation DeleteReservation($input: ReservationDeleteMutationInput!) {
    deleteReservation(input: $input) {
      deleted
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation CancelReservation($input: ReservationCancellationMutationInput!) {
    cancelReservation(input: $input) {
      pk
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
        checkoutUrl
      }
    }
  }
`;

const CANCELLATION_RULE_FRAGMENT = gql`
  fragment CancellationRuleFields on ReservationUnitNode {
    id
    cancellationRule {
      id
      canBeCancelledTimeBefore
    }
  }
`;

const RESERVATION_ORDER_STATUS_FRAGMENT = gql`
  fragment ReservationOrderStatus on ReservationNode {
    state
    paymentOrder {
      id
      status
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
  ${RESERVATION_ORDER_STATUS_FRAGMENT}
  query ListReservations(
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
    $user: [Int]
    $reservationUnits: [Int]
    $orderBy: [ReservationOrderingChoices]
    $reservationType: [ReservationTypeChoice]!
  ) {
    reservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      user: $user
      reservationUnits: $reservationUnits
      orderBy: $orderBy
      reservationType: $reservationType
    ) {
      edges {
        node {
          id
          ...ReservationInfoCard
          name
          bufferTimeBefore
          bufferTimeAfter
          ...ReservationOrderStatus
          paymentOrder {
            id
            checkoutUrl
            expiresInMinutes
          }
          isBlocked
          reservationUnits {
            ...CancellationRuleFields
          }
        }
      }
    }
  }
`;

export const ORDER_FRAGMENT = gql`
  fragment OrderFields on PaymentOrderNode {
    id
    reservationPk
    status
    paymentType
    receiptUrl
    checkoutUrl
  }
`;

export const CAN_USER_CANCEL_RESERVATION_FRAGMENT = gql`
  fragment CanUserCancelReservation on ReservationNode {
    id
    state
    begin
    reservationUnits {
      id
      ...CancellationRuleFields
    }
  }
`;

export const GET_RESERVATION_STATE = gql`
  query ReservationState($id: ID!) {
    reservation(id: $id) {
      id
      pk
      state
    }
  }
`;

export const ADJUST_RESERVATION_TIME = gql`
  mutation AdjustReservationTime($input: ReservationAdjustTimeMutationInput!) {
    adjustReservationTime(input: $input) {
      pk
      state
      begin
      end
    }
  }
`;

export const GET_ORDER = gql`
  query Order($orderUuid: String!) {
    order(orderUuid: $orderUuid) {
      ...OrderFields
    }
  }
`;

export const REFRESH_ORDER = gql`
  mutation RefreshOrder($input: RefreshOrderMutationInput!) {
    refreshOrder(input: $input) {
      orderUuid
      status
    }
  }
`;
