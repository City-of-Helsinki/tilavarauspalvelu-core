import { PaymentNotificationFragment, ReservationCancelReasonChoice, ReservationStateChoice } from "@gql/gql-types";
import { Notification } from "hds-react";
import { ButtonLikeExternalLink } from "common/src/components/ButtonLikeLink";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { convertLanguageCode, toUIDateTime } from "common/src/common/util";
import { Flex, fontMedium } from "common/styled";
import { formatters as getFormatters } from "common";
import React, { useMemo } from "react";
import { breakpoints } from "common/src/const";
import { getPaymentUrl } from "@/modules/reservation";
import { gql } from "@apollo/client";

type PaymentNotificationProps = {
  reservation: PaymentNotificationFragment;
  apiBaseUrl: string;
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

export function PaymentNotification({ reservation, apiBaseUrl }: PaymentNotificationProps) {
  const { t, i18n } = useTranslation();
  const formatters = useMemo(() => getFormatters(i18n.language), [i18n.language]);
  const formatter = formatters["currencyWithDecimals"];
  const { appliedPricing, paymentOrder } = reservation;
  const price = formatter?.format(Number.parseFloat(appliedPricing?.highestPrice ?? "") ?? 0);
  const taxPercentage =
    formatters.strippedDecimal?.format(Number.parseFloat(appliedPricing?.taxPercentage ?? "")) ?? "0";

  const deadline =
    paymentOrder?.handledPaymentDueBy != null
      ? toUIDateTime(new Date(paymentOrder.handledPaymentDueBy), t("common:dayTimeSeparator"))
      : "-";
  const lang = convertLanguageCode(i18n.language);
  const isExpired =
    reservation.state === ReservationStateChoice.Cancelled &&
    reservation.cancelReason === ReservationCancelReasonChoice.NotPaid;
  const translationPath = isExpired ? "reservations:paymentBanner.expired" : "reservations:paymentBanner";
  const paymentUrl = getPaymentUrl(reservation, lang, apiBaseUrl);
  return (
    <Notification data-testid="reservation__payment-notification" type="alert" label={t(`${translationPath}.title`)}>
      <Flex $direction="column" $gap="2-xs">
        {t(`${translationPath}.description`)}
        <PriceDetails>
          <div data-testid="reservation__payment-notification__price">
            {t("common:price")}: {price}
            {` (${t("common:inclTax", { taxPercentage: taxPercentage })})`}
          </div>
          <div data-testid="reservation__payment-notification__deadline">
            {t("common:deadline")}: {deadline}
          </div>
          {!isExpired && (
            <ButtonLikeExternalLink href={paymentUrl} disabled={!paymentUrl} variant="primary">
              {t("reservations:payReservation")}
            </ButtonLikeExternalLink>
          )}
        </PriceDetails>
      </Flex>
    </Notification>
  );
}

export const PAYMENT_NOTIFICATION_ORDER_FRAGMENT = gql`
  fragment PaymentNotification on ReservationNode {
    id
    ...ReservationPaymentUrl
    appliedPricing {
      highestPrice
      taxPercentage
    }
    paymentOrder {
      id
      handledPaymentDueBy
      checkoutUrl
    }
  }
`;
