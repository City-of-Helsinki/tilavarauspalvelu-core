import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { UnitOrderingChoices, useUnitsFilterQuery } from "@gql/gql-types";

// exporting so it doesn't get removed
// TODO combine with other options queries so we only make a single request for all of them
export const UNITS_QUERY = gql`
  query UnitsFilter($orderBy: [UnitOrderingChoices]) {
    unitsAll(onlyWithPermission: true, orderBy: $orderBy) {
      id
      nameFi
      pk
    }
  }
`;

export function useUnitOptions() {
  const { data, loading } = useUnitsFilterQuery({
    variables: {
      orderBy: [UnitOrderingChoices.NameFiAsc],
    },
  });

  const options = filterNonNullable(data?.unitsAll).map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? 0,
  }));

  return { options, loading };
}
