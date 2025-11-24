import React from "react";
import { IconEuroSign } from "hds-react";
import { useTranslation } from "next-i18next";
import { OrderStatus } from "../../../gql/gql-types";
import { StatusLabel } from "../StatusLabel";
import type { StatusLabelType } from "../StatusLabel";

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
      return "neutral";
  }
}

type Props = {
  status: OrderStatus;
  testId?: string;
};

export function OrderStatusLabel({ status, testId }: Props): React.ReactElement {
  const { t } = useTranslation();

  const labelType = getStatusLabelType(status);
  const statusText = t(`reservation:orderStatus.${status}`);

  return (
    <StatusLabel type={labelType} icon={<IconEuroSign />} data-testid={testId}>
      {statusText}
    </StatusLabel>
  );
}
