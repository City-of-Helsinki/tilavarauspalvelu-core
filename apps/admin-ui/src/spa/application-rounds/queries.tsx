import { gql } from "@apollo/client";

const APPLICATION_ROUND_BASE_FRAGMENT = gql`
  fragment ApplicationRoundBase on ApplicationRoundNode {
    id
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
    applicationRounds(onlyWithPermissions: true) {
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
  fragment ApplicationRoundAdmin on ApplicationRoundNode {
    ...ApplicationRoundBase
    applicationsCount
    isSettingHandledAllowed
    reservationCreationStatus
    reservationUnits {
      id
      pk
      nameFi
      unit {
        id
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
      ...ApplicationRoundAdmin
    }
  }
`;
