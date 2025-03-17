import { gql } from "@apollo/client";

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
