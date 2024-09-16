import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { OrderStatus } from "@/gql/gql-types";
import {
  IconEuroSign,
} from "hds-react";
import StatusLabel, {
  StatusLabelType,
} from "common/src/components/StatusLabel";

export type Props = {
  orderStatus: OrderStatus;
} & React.HTMLAttributes<HTMLDivElement>;

export function ReservationOrderStatus({ orderStatus }: Props): JSX.Element {
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
    <StatusLabel type={labelType} icon={<IconEuroSign />}>
      {statusText}
    </StatusLabel>
  );
}
