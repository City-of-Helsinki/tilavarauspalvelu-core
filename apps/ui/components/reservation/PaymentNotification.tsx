import { Notification, NotificationType } from "hds-react";
import { ButtonLikeLink } from "@/components/common/ButtonLikeLink";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { toUIDateTime } from "common/src/common/util";
import { Flex, fontMedium } from "common/styled";
import { formatters as getFormatters } from "common";
import { useMemo } from "react";
import { breakpoints } from "common/src/const";

type PaymentNotificationProps = {
  appliedPricing: {
    highestPrice: string;
    taxPercentage: string;
  } | null;
  paymentOrder: {
    handledPaymentDueBy: string | null;
    checkoutUrl: string | null;
  };
};

const PriceDetails = styled.div`
  display: flex;
  gap: var(--spacing-l);
  justify-content: space-between;
  align-items: center;
  ${fontMedium};
  @media (max-width: ${breakpoints.l}) {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-2-xs);
  }
`;

export const PaymentNotification = ({ appliedPricing, paymentOrder }: PaymentNotificationProps) => {
  const { t, i18n } = useTranslation();
  const formatters = useMemo(() => getFormatters(i18n.language), [i18n.language]);
  const formatter = formatters["currencyWithDecimals"];
  const price = formatter?.format(parseFloat(appliedPricing?.highestPrice ?? "") ?? 0);
  const taxPercentage = formatters.strippedDecimal?.format(parseFloat(appliedPricing?.taxPercentage ?? "")) ?? "0";
  const deadline = toUIDateTime(new Date(paymentOrder?.handledPaymentDueBy ?? ""));
  return (
    <Notification
      data-testid="reservation__payment-notification"
      type={"alert" as NotificationType}
      label={t("reservations:paymentBanner.title")}
    >
      <Flex $direction={"column"} $gap={"2-xs"}>
        {t("reservations:paymentBanner.description")}
        <PriceDetails>
          <div data-testid="reservation__payment-notification__price">
            {t("common:price")}: {price}
            {` (${t("common:inclTax", { taxPercentage: taxPercentage })})`}
          </div>
          <div data-testid="reservation__payment-notification__deadline">
            {t("common:deadline")}: {deadline}
          </div>
          <ButtonLikeLink
            href={paymentOrder?.checkoutUrl ?? ""}
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
          >
            {t("reservations:payReservation")}
          </ButtonLikeLink>
        </PriceDetails>
      </Flex>
    </Notification>
  );
};

export default PaymentNotification;
