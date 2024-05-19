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
        }
      }
    }
  }
`;

export const APPLICATION_ROUND_QUERY = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRound($id: ID!) {
    applicationRound(id: $id) {
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
`;
