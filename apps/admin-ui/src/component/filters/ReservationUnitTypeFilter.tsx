import React from "react";
import { useTranslation } from "react-i18next";
import { useReservationUnitTypesFilterQuery } from "@gql/gql-types";
import type { OptionType } from "@/common/types";
import { SortedSelect } from "@/component/SortedSelect";
import { filterNonNullable } from "common/src/helpers";

type Props = {
  onChange: (reservationUnitType: OptionType[]) => void;
  value: OptionType[];
  style?: React.CSSProperties;
};

const ReservationUnitTypeFilter = ({
  onChange,
  value,
  style,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const { data, loading } = useReservationUnitTypesFilterQuery();

  const qd = data?.reservationUnitTypes;
  const types = filterNonNullable(qd?.edges.map((x) => x?.node));

  const options = types.map((type) => ({
    label: type?.nameFi ?? "",
    value: String(type?.pk ?? 0),
  }));

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
};

export default ReservationUnitTypeFilter;
