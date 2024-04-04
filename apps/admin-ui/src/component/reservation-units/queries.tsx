import { gql } from "@apollo/client";

export const SEARCH_RESERVATION_UNITS_QUERY = gql`
  query SearchReservationUnits(
    $nameFi: String
    $maxPersonsGte: Decimal
    $maxPersonsLte: Decimal
    $surfaceAreaGte: Decimal
    $surfaceAreaLte: Decimal
    $unit: [Int]
    $reservationUnitType: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
    $offset: Int
    $first: Int
    $state: [String]
  ) {
    reservationUnits(
      first: $first
      offset: $offset
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
          pk
          nameFi
          unit {
            nameFi
            pk
          }
          reservationUnitType {
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
