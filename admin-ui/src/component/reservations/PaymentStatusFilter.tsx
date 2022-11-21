import React from "react";
import { useTranslation } from "react-i18next";

import { OptionType } from "../../common/types";
import SortedSelect from "../ReservationUnits/ReservationUnitEditor/SortedSelect";

type Props = {
  onChange: (units: OptionType[]) => void;
  value: OptionType[];
};

const PaymentStatuses = [
  "DRAFT",
  "EXPIRED",
  "CANCELLED",
  "PAID",
  "PAID_MANUALLY",
  "REFUNDED",
];

const PaymentStatusFilter = ({ onChange, value }: Props): JSX.Element => {
  const { t } = useTranslation();

  return (
    <SortedSelect
      sort
      label={t("ReservationsSearch.paymentStatus")}
      multiselect
      placeholder={t("common.filter")}
      options={PaymentStatuses.map((s) => ({
        value: s,
        label: t(`Payment.status.${s}`),
      }))}
      value={value || []}
      onChange={onChange}
      id="payment-status-combobox"
    />
  );
};

export default PaymentStatusFilter;
