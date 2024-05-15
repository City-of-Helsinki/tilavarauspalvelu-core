import React, { useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import type { Query, QueryUnitsArgs, UnitNode } from "@gql/gql-types";
import type { OptionType } from "@/common/types";
import { SortedSelect } from "@/component/SortedSelect";
import { GQL_MAX_RESULTS_PER_QUERY } from "@/common/const";
import { filterNonNullable } from "common/src/helpers";

const UNITS_QUERY = gql`
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
  const [units, setUnits] = useState<UnitNode[]>([]);

  // Copy-paste from ReservationUnitFilter (same issues etc.)
  const offset = units.length > 0 ? units.length : undefined;
  const { loading } = useQuery<Query, QueryUnitsArgs>(UNITS_QUERY, {
    variables: { offset, first: GQL_MAX_RESULTS_PER_QUERY },
    onCompleted: (data) => {
      const qd = data?.units;
      if (qd?.edges.length != null && qd?.totalCount && qd?.edges.length > 0) {
        const ds = filterNonNullable(qd?.edges.map((x) => x?.node));
        setUnits([...units, ...ds]);
      }
    },
  });

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
