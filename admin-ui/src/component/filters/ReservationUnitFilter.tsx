import React from "react";
import { useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Query, ReservationUnitType } from "common/types/gql-types";
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

  const opts: OptionType[] = (data?.reservationUnits?.edges ?? [])
    .map((e) => e?.node)
    .filter((e): e is ReservationUnitType => e != null)
    .map((reservationUnit) => ({
      label: reservationUnit?.nameFi ?? "",
      value: reservationUnit?.pk ?? "",
    }));

  return (
    <SortedSelect
      disabled={loading}
      sort
      label={t("ReservationUnitsFilter.label")}
      multiselect
      placeholder={t("common.filter")}
      options={opts}
      value={value}
      onChange={onChange}
      id="reservation-unit"
    />
  );
};

export default ReservationUnitFilter;
