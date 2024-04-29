import { gql } from "@apollo/client";

export const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundFields on ApplicationRoundNode {
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

// This is a simple variant that maps to RoundPeriod[] for time collision checks
// TODO this should have filter params added on the backend for the status
export const APPLICATION_ROUNDS_PERIODS = gql`
  query ApplicationRoundPeriods {
    applicationRounds {
      edges {
        node {
          pk
          reservationPeriodBegin
          reservationPeriodEnd
          applicationPeriodBegin
          status
          reservationUnits {
            pk
          }
        }
      }
    }
  }
`;

export const APPLICATION_ROUNDS = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRoundsUi($orderBy: [ApplicationRoundOrderingChoices]) {
    applicationRounds(orderBy: $orderBy) {
      edges {
        node {
          ...ApplicationRoundFields
        }
      }
    }
  }
`;
