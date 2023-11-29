import React from "react";
import { useTranslation } from "react-i18next";
import { SortedSelect } from "@/component/SortedSelect";
import { OptionType } from "@/common/types";

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

  const opts: OptionType[] = PaymentStatuses.map((s) => ({
    value: s,
    label: t(`Payment.status.${s}`),
  }));

  return (
    <SortedSelect
      sort
      label={t("ReservationsSearch.paymentStatus")}
      multiselect
      placeholder={t("common.filter")}
      options={opts}
      value={value || []}
      onChange={onChange}
      id="payment-status-combobox"
    />
  );
};

export default PaymentStatusFilter;
