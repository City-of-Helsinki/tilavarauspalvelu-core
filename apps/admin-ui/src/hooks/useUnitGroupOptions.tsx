import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { useOwnUnitGroupsQuery } from "@gql/gql-types";

export function useUnitGroupOptions() {
  const { data, loading } = useOwnUnitGroupsQuery({ fetchPolicy: "cache-and-network" });

  const options = filterNonNullable(data?.unitGroups?.edges)?.map((edge) => ({
    label: edge?.node?.nameFi ?? "",
    value: edge?.node?.pk ?? 0,
  }));

  return { options, loading };
}

// exporting so it doesn't get removed
// TODO combine with other options queries so we only make a single request for all of them
export const OWN_UNIT_GROUPS_QUERY = gql`
  query OwnUnitGroups {
    unitGroups(onlyWithPermission: true) {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
  }
`;
