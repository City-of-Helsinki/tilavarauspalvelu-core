import { gql } from "@apollo/client";

export const RESERVATIONS_QUERY = gql`
  query Reservations(
    $first: Int
    $after: String
    $orderBy: [ReservationOrderingChoices]
    $unit: [Int]
    $reservationUnits: [Int]
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
      reservationUnits: $reservationUnits
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
          ...ReservationCommonFields
          name
          reservationUnits {
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
