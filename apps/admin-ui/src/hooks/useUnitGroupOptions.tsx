import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { useOwnUnitGroupsQuery } from "@gql/gql-types";

export function useUnitGroupOptions({ applicationRoundPk }: { applicationRoundPk?: number } = {}) {
  const { data, loading } = useOwnUnitGroupsQuery({
    variables: { applicationRound: applicationRoundPk },
    fetchPolicy: "cache-and-network",
  });

  const options = filterNonNullable(data?.allUnitGroups).map((n) => ({
    label: n.nameFi ?? "",
    value: n.pk,
  }));

  return { options, loading };
}

// exporting so it doesn't get removed
// TODO combine with other options queries so we only make a single request for all of them
export const OWN_UNIT_GROUPS_QUERY = gql`
  query OwnUnitGroups($applicationRound: Int) {
    allUnitGroups(filter: { onlyWithPermission: true, applicationRound: $applicationRound }) {
          id
          pk
          nameFi
    }
  }
`;
