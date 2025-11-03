import React, { useMemo } from "react";
import { IconEuroSign } from "hds-react";
import { camelCase } from "lodash-es";
import { useTranslation } from "next-i18next";
import StatusLabel, { type StatusLabelType } from "ui/src/components/StatusLabel";
import { OrderStatus } from "@gql/gql-types";

export type Props = {
  orderStatus: OrderStatus;
  testId?: string;
};

export function ReservationOrderStatus({ orderStatus, testId }: Props): JSX.Element {
  const { t } = useTranslation();

  const labelType = useMemo((): StatusLabelType => {
    switch (orderStatus) {
      case OrderStatus.Paid:
      case OrderStatus.Refunded:
        return "success";
      case OrderStatus.Draft:
      case OrderStatus.Pending:
      case OrderStatus.PaidManually:
      case OrderStatus.PaidByInvoice:
        return "alert";
      case OrderStatus.Expired:
        return "error";
      case OrderStatus.Cancelled:
      default:
        return "neutral";
    }
  }, [orderStatus]);

  const statusText = t(`reservations:orderStatus.${camelCase(orderStatus)}`);

  return (
    <StatusLabel type={labelType} icon={<IconEuroSign />} data-testid={testId}>
      {statusText}
    </StatusLabel>
  );
}
