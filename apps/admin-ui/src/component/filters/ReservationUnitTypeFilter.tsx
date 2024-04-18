import { useReservationUnitTypesFilterQuery } from "@gql/gql-types";
import React from "react";
import { useTranslation } from "next-i18next";
import { SortedSelect } from "@/component/SortedSelect";
import { filterNonNullable } from "common/src/helpers";

type OptionType = {
  label: string;
  value: number;
};
type Props = {
  onChange: (reservationUnitType: OptionType[]) => void;
  value: OptionType[];
  style?: React.CSSProperties;
};

export function useReservationUnitTypes () {
  const { data, loading } = useReservationUnitTypesFilterQuery();

  const qd = data?.reservationUnitTypes;
  const types = filterNonNullable(qd?.edges.map((x) => x?.node));

  const options = types.map((type) => ({
    label: type?.nameFi ?? "",
    value: type?.pk ?? 0,
  }));

  return { options, loading };
}

function ReservationUnitTypeFilter({
  onChange,
  value,
  style,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const { options, loading } = useReservationUnitTypes();

  return (
    <SortedSelect
      style={style}
      disabled={loading}
      sort
      label={t("ReservationUnitsSearch.typeLabel")}
      multiselect
      placeholder={t("ReservationUnitsSearch.typePlaceHolder")}
      options={options}
      onChange={(units) => onChange(units)}
      id="type-combobox"
      value={value}
    />
  );
}

export default ReservationUnitTypeFilter;
