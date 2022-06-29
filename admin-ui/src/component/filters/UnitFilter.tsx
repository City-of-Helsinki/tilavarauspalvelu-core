import React from "react";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

import { Query } from "../../common/gql-types";
import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";

const UNITS_QUERY = gql`
  query units {
    units {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
  }
`;

type UnitComboboxProps = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

const UnitFilter = ({ onChange, value }: UnitComboboxProps): JSX.Element => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<Query>(UNITS_QUERY);

  if (loading) {
    return <>{t("ReservationUnitsSearch.unit")}</>;
  }

  return (
    <SortedSelect
      sort
      label={t("ReservationUnitsSearch.unitLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.unitPlaceHolder")}
      options={(data?.units?.edges || [])
        .map((e) => e?.node)
        .map((unit) => ({
          label: unit?.nameFi as string,
          value: String(unit?.pk as number),
        }))}
      value={value}
      onChange={onChange}
      id="reservation-unit-combobox"
    />
  );
};

export default UnitFilter;
