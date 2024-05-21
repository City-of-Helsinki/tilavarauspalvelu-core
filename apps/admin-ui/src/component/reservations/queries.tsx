import { gql } from "@apollo/client";
import { RESERVATION_COMMON_FRAGMENT } from "./fragments";

export const RESERVATIONS_QUERY = gql`
  ${RESERVATION_COMMON_FRAGMENT}
  query Reservations(
    $first: Int
    $after: String
    $unit: [ID]
    $reservationUnitType: [ID]
    $orderBy: [ReservationOrderingChoices]
    $state: [String]
    $textSearch: String
    $priceGte: Decimal
    $priceLte: Decimal
    $beginDate: Date
    $endDate: Date
    $reservationUnit: [ID]
    $orderStatus: [String]
  ) {
    reservations(
      first: $first
      after: $after
      orderBy: $orderBy
      unit: $unit
      reservationUnit: $reservationUnit
      reservationUnitType: $reservationUnitType
      state: $state
      orderStatus: $orderStatus
      textSearch: $textSearch
      priceLte: $priceLte
      priceGte: $priceGte
      beginDate: $beginDate
      endDate: $endDate
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
  mutation staffAdjustReservationTime(
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
