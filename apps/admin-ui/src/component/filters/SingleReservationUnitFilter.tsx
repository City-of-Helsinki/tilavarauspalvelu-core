import React from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  Query,
  QueryReservationUnitsArgs,
  ReservationUnitOrderingChoices,
} from "common/types/gql-types";
import { SortedSelect } from "@/component/SortedSelect";
import { RESERVATION_UNITS_FILTER_PARAMS_QUERY } from "./queries";
import { filterNonNullable } from "common/src/helpers";
import { GQL_MAX_RESULTS_PER_QUERY } from "@/common/const";

type OptionType = {
  label: string;
  value: number;
};
type Props = {
  onChange: (reservationUnits: OptionType) => void;
  value?: OptionType;
  unitPk?: string;
};

const SingleReservationUnitFilter = ({
  onChange,
  value,
  unitPk,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<Query, QueryReservationUnitsArgs>(
    RESERVATION_UNITS_FILTER_PARAMS_QUERY,
    {
      // breaks the cache
      fetchPolicy: "no-cache",
      variables: {
        unit: unitPk != null ? [Number(unitPk)] : undefined,
        orderBy: [ReservationUnitOrderingChoices.NameFiAsc],
        first: GQL_MAX_RESULTS_PER_QUERY,
        offset: undefined,
      },
    }
  );

  const options = filterNonNullable(
    data?.reservationUnits?.edges.map((e) => e?.node)
  ).map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "",
    value: reservationUnit?.pk ?? 0,
  }));
  const valueOption = options.find((o) => o.value === value?.value) ?? null;

  return (
    <SortedSelect
      style={{ zIndex: "var(--tilavaraus-admin-stack-select-over-calendar)" }}
      disabled={loading}
      sort
      label={t("ReservationUnitsFilter.label")}
      placeholder={t("common.select")}
      options={options}
      value={valueOption}
      onChange={onChange}
      id="reservation-unit"
    />
  );
};

export default SingleReservationUnitFilter;
