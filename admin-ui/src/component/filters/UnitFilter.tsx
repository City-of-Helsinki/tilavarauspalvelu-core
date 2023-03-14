import React from "react";
import { gql, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Query, UnitType } from "common/types/gql-types";
import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";

const UNITS_QUERY = gql`
  query units {
    units(onlyWithPermission: true) {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
  }
`;

type Props = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

const UnitFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<Query>(UNITS_QUERY);

  const opts: OptionType[] = (data?.units?.edges || [])
    .map((e) => e?.node)
    .filter((e): e is UnitType => e != null)
    .map((unit) => ({
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
