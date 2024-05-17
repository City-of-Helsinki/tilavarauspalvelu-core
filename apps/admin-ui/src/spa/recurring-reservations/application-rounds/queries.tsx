import { gql } from "@apollo/client";

const APPLICATION_ROUND_BASE_FRAGMENT = gql`
  fragment ApplicationRoundBase on ApplicationRoundNode {
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
  }
`;

export const APPLICATION_ROUNDS_QUERY = gql`
  ${APPLICATION_ROUND_BASE_FRAGMENT}
  query ApplicationRounds {
    applicationRounds {
      edges {
        node {
          ...ApplicationRoundBase
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

const APPLICATION_ROUND_ADMIN_FRAGMENT = gql`
  ${APPLICATION_ROUND_BASE_FRAGMENT}
  fragment ApplicationRoundAdminFragment on ApplicationRoundNode {
    id
    ...ApplicationRoundBase
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
`;

export const APPLICATION_ROUND_QUERY = gql`
  ${APPLICATION_ROUND_ADMIN_FRAGMENT}
  query ApplicationRound($id: ID!) {
    applicationRound(id: $id) {
      ...ApplicationRoundAdminFragment
    }
  }
`;
