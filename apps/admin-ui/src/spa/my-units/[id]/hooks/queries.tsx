import { gql } from "@apollo/client";
import {
  RESERVATION_UNIT_FRAGMENT,
  UNIT_NAME_FRAGMENT,
} from "@/common/fragments";
import { LOCATION_FRAGMENT } from "common/src/queries/fragments";

export const OPTIONS_QUERY = gql`
  query Options {
    reservationPurposes {
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
  ${LOCATION_FRAGMENT}
  ${UNIT_NAME_FRAGMENT}
  query UnitView($id: ID!) {
    unit(id: $id) {
      ...UnitNameFields
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
  ${RESERVATION_UNIT_FRAGMENT}
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationUnit
    }
  }
`;
