import React from "react";
import { useTranslation } from "react-i18next";
import { ReservationsReservationStateChoices } from "common/types/gql-types";
import { SortedSelect } from "@/component/SortedSelect";
import { OptionType } from "@/common/types";

type Props = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

const ReservationStateFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();

  const opts: OptionType[] = Object.values(
    ReservationsReservationStateChoices
  ).map((s) => ({
    value: s,
    label: t(`RequestedReservation.state.${s}`),
  }));

  return (
    <SortedSelect
      label={t("ReservationStateFilter.label")}
      multiselect
      placeholder={t("common.filter")}
      options={opts}
      value={value || []}
      onChange={onChange}
      id="reservation-state"
    />
  );
};

export default ReservationStateFilter;
