import { gql } from "@apollo/client";

export const SPACE_COMMON_FRAGMENT = gql`
  fragment SpaceCommonFields on SpaceNode {
    id
    pk
    nameFi
    parent {
      id
      pk
      nameFi
    }
    surfaceArea
    maxPersons
  }
`;

export const RESOURCE_FRAGMENT = gql`
  fragment ResourceFields on ResourceNode {
    id
    pk
    nameFi
    space {
      id
      nameFi
      unit {
        id
        nameFi
        pk
      }
    }
  }
`;

export const SPACE_FRAGMENT = gql`
  ${SPACE_COMMON_FRAGMENT}
  ${RESOURCE_FRAGMENT}
  fragment SpaceFields on SpaceNode {
    ...SpaceCommonFields
    code
    resourceSet {
      ...ResourceFields
    }
    children {
      id
      pk
    }
  }
`;

export const RESERVATION_UNIT_COMMON_FRAGMENT = gql`
  fragment ReservationUnitCommonFields on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    surfaceArea
    reservationUnitType {
      id
      nameFi
    }
  }
`;

export const UNIT_NAME_FRAGMENT = gql`
  fragment UnitNameFields on UnitNode {
    id
    pk
    nameFi
    serviceSectors {
      id
      pk
      nameFi
    }
  }
`;
