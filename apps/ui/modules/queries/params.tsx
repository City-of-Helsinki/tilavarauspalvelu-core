import { gql } from "@apollo/client";

export const SEARCH_FORM_PARAMS_UNIT = gql`
  query SearchFormParamsUnit(
    $publishedReservationUnits: Boolean
    $ownReservations: Boolean
    $onlyDirectBookable: Boolean
    $onlySeasonalBookable: Boolean
    $orderBy: [UnitOrderingChoices]
  ) {
    units(
      publishedReservationUnits: $publishedReservationUnits
      ownReservations: $ownReservations
      onlyDirectBookable: $onlyDirectBookable
      onlySeasonalBookable: $onlySeasonalBookable
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
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
          id
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
