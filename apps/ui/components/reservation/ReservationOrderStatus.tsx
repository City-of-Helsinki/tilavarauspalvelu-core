import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { OrderStatus } from "@/gql/gql-types";
import {
  IconPen,
  IconEuroSign,
  IconCross,
  IconQuestionCircle,
} from "hds-react";
import StatusLabel, {
  StatusLabelType,
} from "common/src/components/StatusLabel";

export type Props = {
  orderStatus: OrderStatus;
} & React.HTMLAttributes<HTMLDivElement>;

export function ReservationOrderStatus({ orderStatus }: Props): JSX.Element {
  const { t } = useTranslation();

  const labelProps = useMemo((): {
    type: StatusLabelType;
    icon: JSX.Element;
  } => {
    switch (orderStatus) {
      case OrderStatus.Draft:
        return {
          type: "draft",
          icon: <IconPen ariaHidden />,
        };
      case OrderStatus.Paid:
        return {
          type: "success",
          icon: <IconEuroSign ariaHidden />,
        };
      case OrderStatus.PaidManually:
        return {
          type: "alert",
          icon: <IconEuroSign ariaHidden />,
        };
      case OrderStatus.Cancelled:
        return {
          type: "neutral",
          icon: <IconCross ariaHidden />,
        };
      case OrderStatus.Refunded:
        return {
          type: "success",
          icon: <IconEuroSign ariaHidden />,
        };
      case OrderStatus.Expired: // No idea what to do with this
      default:
        return {
          type: "neutral",
          icon: <IconQuestionCircle ariaHidden />,
        };
    }
  }, [orderStatus]);

  const statusText = t(`reservations:orderStatus.${camelCase(orderStatus)}`);

  return (
    <StatusLabel type={labelProps.type} icon={labelProps.icon}>
      {statusText}
    </StatusLabel>
  );
}
