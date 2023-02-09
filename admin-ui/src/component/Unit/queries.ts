import { gql } from "@apollo/client";

export const UNITS_QUERY = gql`
  query units(
    $first: Int
    $offset: Int
    $orderBy: String
    $serviceSector: Decimal
    $nameFi: String
  ) {
    units(
      first: $first
      offset: $offset
      orderBy: $orderBy
      serviceSector: $serviceSector
      nameFi: $nameFi
      onlyWithPermission: true
    ) {
      edges {
        node {
          nameFi
          pk
          serviceSectors {
            nameFi
          }
          reservationUnits {
            pk
          }
        }
      }
      totalCount
    }
  }
`;
