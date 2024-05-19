import { gql } from "@apollo/client";

export const UNITS_QUERY = gql`
  query Units(
    $first: Int
    $offset: Int
    $orderBy: [UnitOrderingChoices]
    $nameFi: String
  ) {
    units(
      first: $first
      offset: $offset
      orderBy: $orderBy
      nameFi: $nameFi
      onlyWithPermission: true
    ) {
      edges {
        node {
          nameFi
          pk
          reservationunitSet {
            pk
          }
        }
      }
      totalCount
    }
  }
`;
