import { gql } from "@apollo/client";
import {
  RESERVATIONUNIT_RESERVATIONS_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
} from "../../reservations/fragments";
import { LOCATION_FRAGMENT } from "common/src/queries/fragments";
import { UNIT_NAME_FRAGMENT } from "@/common/fragments";

export const OPTIONS_QUERY = gql`
  query options {
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
      reservationunitSet {
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
  ${RESERVATIONUNIT_RESERVATIONS_FRAGMENT}
  query ReservationUnitsByUnit(
    $id: ID!
    $pk: Int!
    $state: [String]
    $beginDate: Date
    $endDate: Date
  ) {
    unit(id: $id) {
      id
      reservationunitSet {
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
        reservationSet(
          beginDate: $beginDate
          endDate: $endDate
          state: $state
        ) {
          ...ReservationUnitReservations
        }
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
  query reservationUnits($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationUnit
    }
  }
`;
