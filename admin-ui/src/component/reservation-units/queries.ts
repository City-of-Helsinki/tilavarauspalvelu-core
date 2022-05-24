import { gql } from "@apollo/client";

export const SEARCH_RESERVATION_UNITS_QUERY = gql`
  query searchReservationUnits(
    $nameFi: String
    $after: String
    $maxPersonsGte: Float
    $maxPersonsLte: Float
    $surfaceAreaGte: Float
    $surfaceAreaLte: Float
    $unit: [ID]
    $reservationUnitType: [ID]
    $orderBy: String
    $offset: Int
    $first: Int
  ) {
    reservationUnits(
      first: $first
      offset: $offset
      orderBy: $orderBy
      nameFi: $nameFi
      after: $after
      maxPersonsGte: $maxPersonsGte
      maxPersonsLte: $maxPersonsLte
      surfaceAreaGte: $surfaceAreaGte
      surfaceAreaLte: $surfaceAreaLte
      unit: $unit
      reservationUnitType: $reservationUnitType
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
        }
      }
      pageInfo {
        hasNextPage
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const RESERVATION_UNIT_TYPES_QUERY = gql`
  query reservationUnitTypes {
    reservationUnitTypes {
      edges {
        node {
          pk
          nameFi
        }
      }
    }
  }
`;
