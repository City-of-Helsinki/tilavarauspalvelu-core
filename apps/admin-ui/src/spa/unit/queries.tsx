import { gql } from "@apollo/client";

export const UNITS_QUERY = gql`
  query Units(
    $first: Int
    $after: String
    $orderBy: [UnitOrderingChoices]
    $nameFi: String
  ) {
    units(
      first: $first
      after: $after
      orderBy: $orderBy
      nameFi: $nameFi
      onlyWithPermission: true
    ) {
      edges {
        node {
          id
          nameFi
          pk
          unitGroups {
            id
            nameFi
          }
          reservationunitSet {
            id
            pk
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
