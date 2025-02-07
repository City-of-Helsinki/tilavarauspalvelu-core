import { gql } from "@apollo/client";

export const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundFields on ApplicationRoundNode {
    pk
    id
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
    notesWhenApplyingFi
    notesWhenApplyingEn
    notesWhenApplyingSv
    reservationUnits {
      id
      pk
      unit {
        id
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
          id
          pk
          reservationPeriodBegin
          reservationPeriodEnd
          applicationPeriodBegin
          status
          reservationUnits {
            id
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
