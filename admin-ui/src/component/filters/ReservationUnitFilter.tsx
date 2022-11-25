import React from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Query } from "common/types/gql-types";
import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";
import { RESERVATION_UNITS_QUERY } from "./queries";

type Props = {
  onChange: (reservationUnits: OptionType[]) => void;
  value: OptionType[];
};

const ReservationUnitFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { data, loading } = useQuery<Query>(RESERVATION_UNITS_QUERY);

  return (
    <SortedSelect
      disabled={loading}
      sort
      label={t("ReservationUnitsFilter.label")}
      multiselect
      placeholder={t("common.filter")}
      options={(data?.reservationUnits?.edges || [])
        .map((e) => e?.node)
        .map((reservationUnit) => ({
          label: reservationUnit?.nameFi as string,
          value: String(reservationUnit?.pk as number),
        }))}
      value={value}
      onChange={onChange}
      id="reservation-unit"
    />
  );
};

export default ReservationUnitFilter;
