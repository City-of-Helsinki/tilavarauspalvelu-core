import { camelCase } from "lodash";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { truncatedText } from "../../styles/util";
import { OrderStatus } from "@/gql/gql-types";

export type Props = {
  orderStatus: OrderStatus;
} & React.HTMLAttributes<HTMLDivElement>;

const Wrapper = styled.div<{ $color: string }>`
  display: inline-block;
  padding: var(--spacing-3-xs) var(--spacing-2-xs);
  background-color: ${({ $color }) => $color};
  line-height: var(--lineheight-l);
  font-size: var(--fontsize-body-s);
  ${truncatedText};
`;

export function ReservationOrderStatus({
  orderStatus,
  ...rest
}: Props): JSX.Element {
  const { t } = useTranslation();

  const color = useMemo(() => {
    switch (orderStatus) {
      case OrderStatus.Draft:
        return "var(--color-summer-light)";
      case OrderStatus.Paid:
        return "var(--color-info-light)";
      case OrderStatus.PaidManually:
        return "var(--color-gold-light)";
      case OrderStatus.Cancelled:
        return "var(--color-error-light)";
      case OrderStatus.Expired:
        return "var(--color-metro-medium-light)";
      case OrderStatus.Refunded:
        return "var(--color-bus-light)";
      default:
        return "";
    }
  }, [orderStatus]);

  const statusText = t(`reservations:orderStatus.${camelCase(orderStatus)}`);

  return (
    <Wrapper $color={color} {...rest} title={statusText}>
      {statusText}
    </Wrapper>
  );
}
