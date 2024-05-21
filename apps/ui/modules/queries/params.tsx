import { gql } from "@apollo/client";

export const SEARCH_FORM_PARAMS_UNIT = gql`
  query SearchFormParamsUnit(
    $publishedReservationUnits: Boolean
    $ownReservations: Boolean
    $orderBy: [UnitOrderingChoices]
  ) {
    units(
      publishedReservationUnits: $publishedReservationUnits
      ownReservations: $ownReservations
      orderBy: $orderBy
    ) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
  }
`;

export const RESERVATION_UNIT_PURPOSES = gql`
  query ReservationUnitPurposes($orderBy: [PurposeOrderingChoices]) {
    purposes(orderBy: $orderBy) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
          smallUrl
        }
      }
    }
  }
`;
