import { gql } from "@apollo/client";

export const SEARCH_FORM_PARAMS_UNIT = gql`
  query SearchFormParamsUnit {
    units {
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
