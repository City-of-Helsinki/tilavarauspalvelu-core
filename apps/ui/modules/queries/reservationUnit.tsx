import { gql } from "@apollo/client";

export const RESERVATION_UNIT_TYPE_FRAGMENT = gql`
  fragment ReservationUnitTypeFields on ReservationUnitTypeNode {
    id
    pk
    nameFi
    nameEn
    nameSv
  }
`;

export const RESERVATION_UNIT_NAME_FRAGMENT = gql`
  fragment ReservationUnitNameFields on ReservationUnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
  }
`;

export const EQUIPMENT_FRAGMENT = gql`
  fragment EquipmentFields on EquipmentNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    category {
      id
      nameFi
      nameEn
      nameSv
    }
  }
`;

export const BLOCKING_RESERVATION_FRAGMENT = gql`
  fragment BlockingReservationFields on ReservationNode {
    pk
    id
    state
    isBlocked
    begin
    end
    numPersons
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
  }
`;
