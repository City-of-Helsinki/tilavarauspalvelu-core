import { gql } from "@apollo/client";
import { ReservationTypeChoice } from "common/types/gql-types";
import {
  RESERVEE_NAME_FRAGMENT,
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
    }
  }
`;

export const UPDATE_RESERVATION = gql`
  mutation updateReservation($input: ReservationUpdateMutationInput!) {
    updateReservation(input: $input) {
      pk
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
        checkoutUrl
      }
    }
  }
`;

const CANCELLATION_RULE_FRAGMENT = gql`
  fragment CancellationRuleFields on ReservationUnitNode {
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
    $beginDate: Date
    $endDate: Date
    $state: [String]
    $user: ID!
    $reservationUnit: [ID]
    $orderBy: [ReservationOrderingChoices]
  ) {
    reservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      user: $user
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      reservationType: "${ReservationTypeChoice.Normal.toLowerCase()}"
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
            expiresInMinutes
          }
          isBlocked
          reservationUnit {
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

// NOTE this is used to display some general info about the reservation (on /reservation/:id page)
const RESERVATION_INFO_FRAGMENT = gql`
  fragment ReservationInfoFragment on ReservationNode {
    description
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
  }
`;

// TODO do we need all the fields from ReservationUnitNode? ex. pricing (since we should be using the Reservations own pricing anyway)
// TODO can we split this into smaller queries? per case?
// making a reservation, showing a reservation, editing a reservation, cancelling a reservation
// TODO why pricing fields? instead of asking the reservation price info? lets say the unit is normally paid only but you made the reservation free
export const GET_RESERVATION = gql`
  ${RESERVEE_NAME_FRAGMENT}
  ${RESERVATION_UNIT_FRAGMENT}
  ${CANCELLATION_RULE_FRAGMENT}
  ${RESERVATION_INFO_FRAGMENT}
  query Reservation($id: ID!) {
    reservation(id: $id) {
      pk
      name
      ...ReserveeNameFields
      bufferTimeBefore
      bufferTimeAfter
      begin
      end
      calendarUrl
      user {
        email
        pk
      }
      state
      price
      priceNet
      taxPercentageValue
      order {
        orderUuid
        status
      }
      reservationUnit {
        ...ReservationUnitFields
        ...CancellationRuleFields
      }
      ...ReservationInfoFragment
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
