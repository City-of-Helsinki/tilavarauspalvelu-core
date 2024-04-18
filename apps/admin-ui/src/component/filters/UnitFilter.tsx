import React from "react";
import { gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useUnitsFilterQuery } from "@gql/gql-types";
import { SortedSelect } from "@/component/SortedSelect";
import { filterNonNullable } from "common/src/helpers";

// exporting so it doesn't get removed
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

type OptionType = {
  label: string;
  value: number;
};
type Props = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

export function useUnitFilterOptions() {
  const query = useUnitsFilterQuery();

  const units = filterNonNullable(query.data?.units?.edges.map((x) => x?.node));

  const options = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? 0,
  }));

  return { options, ...query };
}

export function UnitFilter({ onChange, value }: Props): JSX.Element {
  const { t } = useTranslation();

  const { options, loading } = useUnitFilterOptions();

  return (
    <SortedSelect
      disabled={loading}
      sort
      label={t("ReservationUnitsSearch.unitLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.unitPlaceHolder")}
      options={options}
      value={value}
      onChange={onChange}
      id="reservation-unit-combobox"
    />
  );
}
