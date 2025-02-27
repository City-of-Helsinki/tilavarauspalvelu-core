import { gql } from "@apollo/client";

export const SEARCH_FORM_PARAMS_UNIT = gql`
  query SearchFormParamsUnit(
    $publishedReservationUnits: Boolean
    $ownReservations: Boolean
    $onlyDirectBookable: Boolean
    $onlySeasonalBookable: Boolean
    $orderBy: [UnitOrderingChoices]
  ) {
    unitsAll(
      publishedReservationUnits: $publishedReservationUnits
      ownReservations: $ownReservations
      onlyDirectBookable: $onlyDirectBookable
      onlySeasonalBookable: $onlySeasonalBookable
      orderBy: $orderBy
    ) {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
  }
`;
