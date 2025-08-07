import {
  ReservationCancelReasonChoice,
  type ReservationPaymentUrlFragment,
  type ReservationPriceFieldsFragment,
  ReservationStateChoice,
} from "@gql/gql-types";
import { Notification } from "hds-react";
import { ButtonLikeExternalLink } from "@/components/common/ButtonLikeLink";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { convertLanguageCode, toUIDateTime } from "common/src/common/util";
import { Flex, fontMedium } from "common/styled";
import { formatters as getFormatters } from "common";
import React, { useMemo } from "react";
import { breakpoints } from "common/src/const";
import { getPaymentUrl } from "@/modules/reservation";

type PaymentNotificationProps = {
  reservation: ReservationPaymentUrlFragment & Pick<ReservationPriceFieldsFragment, "price">;
  appliedPricing: {
    highestPrice: string;
    taxPercentage: string;
  } | null;
  paymentOrder: {
    handledPaymentDueBy: string | null;
    checkoutUrl: string | null;
  } | null;
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

export const PaymentNotification = ({
  reservation,
  appliedPricing,
  paymentOrder,
  apiBaseUrl,
}: PaymentNotificationProps) => {
  const { t, i18n } = useTranslation();
  const formatters = useMemo(() => getFormatters(i18n.language), [i18n.language]);
  const formatter = formatters["currencyWithDecimals"];
  const price = formatter?.format(parseFloat(reservation.price ?? "") ?? 0);
  const taxPercentage = formatters.strippedDecimal?.format(parseFloat(appliedPricing?.taxPercentage ?? "")) ?? "0";

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
      <Flex $direction={"column"} $gap={"2-xs"}>
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
};

export default PaymentNotification;
