import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import { UnitOrderSet, useUnitsFilterQuery } from "@gql/gql-types";

export function useUnitOptions() {
  const { data, loading } = useUnitsFilterQuery({
    variables: {
      orderBy: [UnitOrderSet.NameFiAsc],
    },
  });

  const options = filterNonNullable(data?.allUnits).map((unit) => ({
    label: unit.nameFi ?? "",
    value: unit.pk,
  }));

  return { options, loading };
}

// exporting so it doesn't get removed
// TODO combine with other options queries so we only make a single request for all of them
export const UNITS_FILTER_QUERY = gql`
  query UnitsFilter($orderBy: [UnitOrderSet!]) {
    allUnits(filter: { onlyWithPermission: true }, orderBy: $orderBy) {
      id
      nameFi
      pk
    }
  }
`;
