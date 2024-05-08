import { gql } from "@apollo/client";
import { useUnitsFilterQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";

// exporting so it doesn't get removed
// TODO combine with other options queries so we only make a single request for all of them
export const UNITS_QUERY = gql`
  query UnitsFilter($offset: Int, $first: Int) {
    units(onlyWithPermission: true, offset: $offset, first: $first) {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
      totalCount
    }
  }
`;

export function useUnitFilterOptions() {
  const query = useUnitsFilterQuery();

  const units = filterNonNullable(query.data?.units?.edges.map((x) => x?.node));

  const options = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? 0,
  }));

  return { options, ...query };
}
