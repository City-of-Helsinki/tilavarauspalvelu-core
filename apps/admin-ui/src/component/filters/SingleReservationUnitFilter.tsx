import React from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";

import { Query, QueryReservationUnitsArgs } from "common/types/gql-types";
import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";
import { RESERVATION_UNITS_QUERY } from "./queries";

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
    RESERVATION_UNITS_QUERY,
    {
      variables: { unit: [unitPk ?? ""] },
      skip: !unitPk,
    }
  );

  const options = (data?.reservationUnits?.edges || [])
    .map((e) => e?.node)
    .map((reservationUnit) => ({
      label: reservationUnit?.nameFi ?? "",
      value: reservationUnit?.pk ?? "",
    }));
  const valueOption = options.find((o) => o.value === value?.value) ?? {
    value: "",
    label: "",
  };

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
