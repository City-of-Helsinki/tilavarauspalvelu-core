import { gql } from "@apollo/client";

const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundFragment on ApplicationRoundNode {
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
  }
`;

export const APPLICATION_ROUNDS_QUERY = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRounds {
    applicationRounds {
      edges {
        node {
          ...ApplicationRoundFragment
          reservationPeriodBegin
          reservationPeriodEnd
          applicationsCount
          reservationUnitCount
          statusTimestamp
          serviceSector {
            pk
            nameFi
          }
        }
      }
    }
  }
`;

// TODO replace with relay query
export const APPLICATION_ROUND_QUERY = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRound($pk: [Int]!) {
    applicationRounds(pk: $pk) {
      edges {
        node {
          ...ApplicationRoundFragment
          applicationsCount
          reservationUnits {
            pk
            nameFi
            unit {
              pk
              nameFi
            }
          }
        }
      }
    }
  }
`;
