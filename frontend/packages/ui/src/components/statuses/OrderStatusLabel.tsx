import React from "react";
import { useTranslation } from "next-i18next";
import { OrderStatus } from "../../../gql/gql-types";
import { IconEuroSign } from "hds-react";
import StatusLabel, { type StatusLabelType } from "../StatusLabel";

function getStatusLabelType(status: OrderStatus): StatusLabelType {
  switch (status) {
    case OrderStatus.Paid:
    case OrderStatus.Refunded:
      return "success";
    case OrderStatus.Expired:
      return "error";
    case OrderStatus.PaidByInvoice:
    case OrderStatus.PaidManually:
    case OrderStatus.Pending:
    case OrderStatus.Draft:
      return "alert";
    case OrderStatus.Cancelled:
    default:
      return "neutral";
  }
}

type Props = {
  status: OrderStatus;
  testId?: string;
};

export function OrderStatusLabel({ status, testId }: Props): JSX.Element {
  const { t } = useTranslation();

  const labelType = getStatusLabelType(status);
  const statusText = t(`reservation:orderStatus.${status}`);

  return (
    <StatusLabel type={labelType} icon={<IconEuroSign />} data-testid={testId}>
      {statusText}
    </StatusLabel>
  );
}
