import { gql } from "@apollo/client";

export const SEARCH_RESERVATION_UNITS_QUERY = gql`
  query SearchReservationUnits(
    $after: String
    $first: Int
    $nameFi: String
    $maxPersonsGte: Decimal
    $maxPersonsLte: Decimal
    $surfaceAreaGte: Decimal
    $surfaceAreaLte: Decimal
    $unit: [Int]
    $reservationUnitType: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
    $state: [ReservationUnitState]
  ) {
    reservationUnits(
      first: $first
      after: $after
      orderBy: $orderBy
      nameFi: $nameFi
      maxPersonsGte: $maxPersonsGte
      minPersonsGte: $maxPersonsGte
      maxPersonsLte: $maxPersonsLte
      minPersonsLte: $maxPersonsLte
      surfaceAreaGte: $surfaceAreaGte
      surfaceAreaLte: $surfaceAreaLte
      unit: $unit
      reservationUnitType: $reservationUnitType
      state: $state
      onlyWithPermission: true
    ) {
      edges {
        node {
          id
          pk
          nameFi
          unit {
            id
            nameFi
            pk
          }
          reservationUnitType {
            id
            nameFi
          }
          maxPersons
          surfaceArea
          state
          reservationState
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;
