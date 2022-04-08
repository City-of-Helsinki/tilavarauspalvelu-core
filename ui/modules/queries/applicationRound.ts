import { gql } from "@apollo/client";

export const APPLICATION_ROUNDS = gql`
  query ApplicationRounds {
    applicationRounds {
      edges {
        node {
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
          }
        }
      }
    }
  }
`;
