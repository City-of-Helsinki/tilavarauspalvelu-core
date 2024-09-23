import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { OrderStatus } from "@/gql/gql-types";
import { IconEuroSign } from "hds-react";
import StatusLabel from "common/src/components/StatusLabel";
import { type StatusLabelType } from "common/src/tags";

export type Props = {
  orderStatus: OrderStatus;
  testId?: string;
};

export function ReservationOrderStatus({
  orderStatus,
  testId,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const labelType = useMemo((): StatusLabelType => {
    switch (orderStatus) {
      case OrderStatus.Paid:
      case OrderStatus.Refunded:
        return "success";
      case OrderStatus.Draft:
      case OrderStatus.PaidManually:
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
    <StatusLabel type={labelType} icon={<IconEuroSign />} testId={testId}>
      {statusText}
    </StatusLabel>
  );
}
