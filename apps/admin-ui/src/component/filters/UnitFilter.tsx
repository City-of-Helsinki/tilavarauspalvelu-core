import React from "react";
import { gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useUnitsFilterQuery } from "@gql/gql-types";
import type { OptionType } from "@/common/types";
import { SortedSelect } from "@/component/SortedSelect";
import { filterNonNullable } from "common/src/helpers";

// exporting so it doesn't get removed
export const UNITS_QUERY = gql`
  query UnitsFilter($offset: Int, $first: Int) {
    units(onlyWithPermission: true, offset: $offset, first: $first) {
      edges {
        node {
          nameFi
          pk
        }
      }
      totalCount
    }
  }
`;

type Props = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

const UnitFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();

  // Copy-paste from ReservationUnitFilter (same issues etc.)
  const { data, loading } = useUnitsFilterQuery();

  const units = filterNonNullable(data?.units?.edges.map((x) => x?.node));

  const opts: OptionType[] = units.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? "",
  }));

  return (
    <SortedSelect
      disabled={loading}
      sort
      label={t("ReservationUnitsSearch.unitLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.unitPlaceHolder")}
      options={opts}
      value={value}
      onChange={onChange}
      id="reservation-unit-combobox"
    />
  );
};

export default UnitFilter;
