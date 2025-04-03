import { gql } from "@apollo/client";

export const OPTIONS_QUERY = gql`
  query Options(
    $reservationPurposesOrderBy: [ReservationPurposeOrderingChoices]
  ) {
    reservationPurposes(orderBy: $reservationPurposesOrderBy) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
    ageGroups {
      edges {
        node {
          id
          pk
          minimum
          maximum
        }
      }
    }
    cities {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
  }
`;

export const UNIT_VIEW_QUERY = gql`
  query UnitView($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      location {
        ...LocationFields
      }
      reservationUnits {
        id
        pk
        nameFi
        spaces {
          id
          pk
        }
      }
    }
  }
`;

export const RESERVATION_UNITS_BY_UNIT = gql`
  query ReservationUnitsByUnit(
    $id: ID!
    $pk: Int!
    $state: [ReservationStateChoice]
    $beginDate: Date
    $endDate: Date
  ) {
    unit(id: $id) {
      id
      reservationUnits {
        id
        pk
        nameFi
        spaces {
          id
          pk
        }
        reservationUnitType {
          id
          pk
        }
        bufferTimeBefore
        bufferTimeAfter
        isDraft
        authentication
      }
    }
    affectingReservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      forUnits: [$pk]
    ) {
      ...ReservationUnitReservations
    }
  }
`;

export const RESERVATION_UNIT_QUERY = gql`
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationUnitFields
    }
  }
`;
