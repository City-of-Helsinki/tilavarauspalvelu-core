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
  query applicationRounds {
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

export const APPLICATION_ROUND_QUERY = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRoundCriteria($pk: [Int]!) {
    applicationRounds(pk: $pk) {
      edges {
        node {
          ...ApplicationRoundFragment
          applicationsCount
          reservationUnits {
            pk
          }
        }
      }
    }
  }
`;
