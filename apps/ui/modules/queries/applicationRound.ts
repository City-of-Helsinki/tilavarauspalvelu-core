import { gql } from "@apollo/client";

export const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundFields on ApplicationRoundType {
    pk
    nameFi
    nameEn
    nameSv
    reservationPeriodBegin
    reservationPeriodEnd
    publicDisplayBegin
    publicDisplayEnd
    applicationPeriodBegin
    applicationPeriodEnd
    status
    criteriaFi
    criteriaEn
    criteriaSv
    reservationUnits {
      pk
      unit {
        pk
      }
    }
  }
`;

export const APPLICATION_ROUNDS = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRounds {
    applicationRounds {
      edges {
        node {
          ...ApplicationRoundFields
        }
      }
    }
  }
`;
