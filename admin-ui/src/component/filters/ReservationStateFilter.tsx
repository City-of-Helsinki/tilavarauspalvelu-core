import React from "react";
import { useTranslation } from "react-i18next";
import { ReservationsReservationStateChoices } from "../../common/gql-types";

import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";

type Props = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

const ReservationStates = [
  ReservationsReservationStateChoices.Created,
  ReservationsReservationStateChoices.Confirmed,
  ReservationsReservationStateChoices.RequiresHandling,
  ReservationsReservationStateChoices.Denied,
  ReservationsReservationStateChoices.Cancelled,
  ReservationsReservationStateChoices.WaitingForPayment,
];

const ReservationStateFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <SortedSelect
      label={t("ReservationStateFilter.label")}
      multiselect
      placeholder={t("common.filter")}
      options={ReservationStates.map((s) => ({
        value: s,
        label: t(`RequestedReservation.state.${s}`),
      }))}
      value={value || []}
      onChange={onChange}
      id="reservation-state"
    />
  );
};

export default ReservationStateFilter;
