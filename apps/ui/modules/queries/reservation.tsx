import { gql } from "@apollo/client";

export const CREATE_RESERVATION = gql`
  mutation CreateReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
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
  mutation DeleteReservation($input: ReservationDeleteTentativeMutationInput!) {
    deleteTentativeReservation(input: $input) {
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

export const CANCELLATION_RULE_FRAGMENT = gql`
  fragment CancellationRuleFields on ReservationUnitNode {
    id
    cancellationRule {
      id
      canBeCancelledTimeBefore
    }
  }
`;

export const RESERVATION_ORDER_STATUS_FRAGMENT = gql`
  fragment ReservationOrderStatus on ReservationNode {
    id
    state
    paymentOrder {
      id
      status
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

export const ACCESS_CODE = gql`
  query AccessCode($id: ID!) {
    reservation(id: $id) {
      id
      pindoraInfo {
        accessCode
        accessCodeBeginsAt
        accessCodeEndsAt
        accessCodeIsActive
      }
    }
  }
`;
