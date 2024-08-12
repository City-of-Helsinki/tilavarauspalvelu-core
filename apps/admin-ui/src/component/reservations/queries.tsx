import { gql } from "@apollo/client";
import { RESERVATION_COMMON_FRAGMENT } from "./fragments";

export const RESERVATIONS_QUERY = gql`
  ${RESERVATION_COMMON_FRAGMENT}
  query Reservations(
    $first: Int
    $after: String
    $orderBy: [ReservationOrderingChoices]
    $unit: [Int]
    $reservationUnit: [Int]
    $reservationUnitType: [Int]
    $reservationType: [ReservationTypeChoice]
    $state: [ReservationStateChoice]
    $orderStatus: [OrderStatusWithFree]
    $textSearch: String
    $priceLte: Decimal
    $priceGte: Decimal
    $beginDate: Date
    $endDate: Date
    $createdAtGte: Date
    $createdAtLte: Date
    $applyingForFreeOfCharge: Boolean
    $isRecurring: Boolean
  ) {
    reservations(
      first: $first
      after: $after
      orderBy: $orderBy
      unit: $unit
      reservationUnit: $reservationUnit
      reservationUnitType: $reservationUnitType
      reservationType: $reservationType
      state: $state
      orderStatus: $orderStatus
      textSearch: $textSearch
      priceLte: $priceLte
      priceGte: $priceGte
      beginDate: $beginDate
      endDate: $endDate
      createdAtGte: $createdAtGte
      createdAtLte: $createdAtLte
      isRecurring: $isRecurring
      applyingForFreeOfCharge: $applyingForFreeOfCharge
      onlyWithPermission: true
    ) {
      edges {
        node {
          ...ReservationCommon
          name
          reservationUnit {
            id
            nameFi
            unit {
              id
              nameFi
            }
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const CHANGE_RESERVATION_TIME = gql`
  mutation StaffAdjustReservationTime(
    $input: ReservationStaffAdjustTimeMutationInput!
  ) {
    staffAdjustReservationTime(input: $input) {
      pk
      begin
      end
      state
    }
  }
`;
