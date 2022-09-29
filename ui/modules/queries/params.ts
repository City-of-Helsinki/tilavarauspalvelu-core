import { gql } from "@apollo/client";

export const SEARCH_FORM_PARAMS_UNIT = gql`
  query SearchFormParamsUnit(
    $publishedReservationUnits: Boolean
    $ownReservations: Boolean
    $orderBy: String
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

export const SEARCH_FORM_PARAMS_PURPOSE = gql`
  query SearchFormParamsPurpose {
    purposes {
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

export const RESERVATION_PURPOSES = gql`
  query ReservationPurposes {
    reservationPurposes {
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

export const AGE_GROUPS = gql`
  query AgeGroups {
    ageGroups {
      edges {
        node {
          pk
          minimum
          maximum
        }
      }
    }
  }
`;

export const CITIES = gql`
  query Cities {
    cities {
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
