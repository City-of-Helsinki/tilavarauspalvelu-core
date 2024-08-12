import { useEffect } from "react";
import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { UnitOrderingChoices, useUnitsFilterQuery } from "@gql/gql-types";

// exporting so it doesn't get removed
// TODO combine with other options queries so we only make a single request for all of them
export const UNITS_QUERY = gql`
  query UnitsFilter($after: String, $orderBy: [UnitOrderingChoices]) {
    units(onlyWithPermission: true, after: $after, orderBy: $orderBy) {
      edges {
        node {
          id
          nameFi
          pk
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

export function useUnitOptions() {
  const { data, loading, fetchMore } = useUnitsFilterQuery({
    variables: {
      orderBy: [UnitOrderingChoices.NameFiAsc],
    },
  });

  // auto fetch more (there is no limit, expect number of them would be a few hundred, but in theory this might cause problems)
  // NOTE have to useEffect, onComplete stops at 200 items
  useEffect(() => {
    const { pageInfo } = data?.units ?? {};
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          after: pageInfo.endCursor,
        },
      });
    }
  }, [data, fetchMore]);

  const units = filterNonNullable(data?.units?.edges.map((x) => x?.node));

  const options = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? 0,
  }));

  return { options, loading };
}
