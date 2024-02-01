import { gql } from "@apollo/client";

export const SPACE_COMMON_FRAGMENT = gql`
  fragment SpaceCommonFields on SpaceType {
    pk
    nameFi
    parent {
      pk
      nameFi
    }
    surfaceArea
    maxPersons
  }
`;

export const RESOURCE_FRAGMENT = gql`
  fragment ResourceFields on ResourceType {
    pk
    nameFi
    space {
      nameFi
      unit {
        nameFi
        pk
      }
    }
  }
`;

export const SPACE_FRAGMENT = gql`
  ${SPACE_COMMON_FRAGMENT}
  ${RESOURCE_FRAGMENT}
  fragment SpaceFields on SpaceType {
    ...SpaceCommonFields
    code
    resources {
      ...ResourceFields
    }
  }
`;

export const RESERVATION_UNIT_COMMON_FRAGMENT = gql`
  fragment ReservationUnitCommonFields on ReservationUnitType {
    pk
    nameFi
    maxPersons
    surfaceArea
    reservationUnitType {
      nameFi
    }
  }
`;

export const UNIT_NAME_FRAGMENT = gql`
  fragment UnitNameFields on UnitType {
    pk
    nameFi
    serviceSectors {
      pk
      nameFi
    }
  }
`;
