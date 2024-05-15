import { gql } from "@apollo/client";

const APPLICATION_ROUND_ADMIN_FRAGMENT = gql`
  fragment ApplicationRoundAdminFragment on ApplicationRoundNode {
    pk
    nameFi
    status
    applicationPeriodBegin
    applicationPeriodEnd
  }
`;

export const APPLICATION_ROUNDS_QUERY = gql`
  ${APPLICATION_ROUND_ADMIN_FRAGMENT}
  query ApplicationRounds {
    applicationRounds {
      edges {
        node {
          ...ApplicationRoundAdminFragment
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
  ${APPLICATION_ROUND_ADMIN_FRAGMENT}
  query ApplicationRound($id: ID!) {
    applicationRound(id: $id) {
      ...ApplicationRoundAdminFragment
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
