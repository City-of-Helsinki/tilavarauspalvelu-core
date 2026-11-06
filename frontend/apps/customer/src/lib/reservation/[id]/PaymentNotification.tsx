import React, { useMemo } from "react";
import { Notification } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { ButtonLikeLink } from "@ui/components/ButtonLikeLink";
import { formatters as getFormatters } from "@ui/index";
import { breakpoints } from "@ui/modules/const";
import { formatDateTime, parseValidDateObject } from "@ui/modules/date-utils";
import { getLocalizationLang } from "@ui/modules/helpers";
import { Flex, fontMedium } from "@ui/styled";
import { ReservationCancelReasonChoice, ReservationStateChoice } from "@gql/gql-types";
import type { ReservationPaymentUrlFragment, ReservationPriceLinesFieldsFragment } from "@gql/gql-types";
import { formatPrice, getPriceLineStringList, getReservationPriceDisplayFromLines } from "@/modules/price";
import { getPaymentUrl } from "@/modules/reservation";

type PaymentNotificationProps = {
  reservation: ReservationPaymentUrlFragment & ReservationPriceLinesFieldsFragment;
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

export const PaymentNotification = ({ reservation, paymentOrder, apiBaseUrl }: PaymentNotificationProps) => {
  const { t, i18n } = useTranslation();
  const formatters = useMemo(() => getFormatters(i18n.language), [i18n.language]);
  const lang = getLocalizationLang(i18n.language);
  const priceDisplay = getReservationPriceDisplayFromLines(reservation, lang);
  const price = formatPrice(priceDisplay.total, true, lang);
  const priceLineList = getPriceLineStringList(priceDisplay, lang);
  const taxPercentage =
    priceDisplay.taxPercentage != null ? formatters.strippedDecimal?.format(priceDisplay.taxPercentage) : null;

  const deadline =
    paymentOrder?.handledPaymentDueBy != null
      ? formatDateTime(parseValidDateObject(paymentOrder.handledPaymentDueBy), {
          t,
          includeWeekday: false,
        })
      : "-";
  const isExpired =
    reservation.state === ReservationStateChoice.Cancelled &&
    reservation.cancelReason === ReservationCancelReasonChoice.NotPaid;
  const translationPath = isExpired ? "reservation:paymentBanner.expired" : "reservation:paymentBanner";
  const paymentUrl = getPaymentUrl(reservation, lang, apiBaseUrl);
  return (
    <Notification data-testid="reservation__payment-notification" type="alert" label={t(`${translationPath}.title`)}>
      <Flex $direction="column" $gap="2-xs">
        {t(`${translationPath}.description`)}
        <PriceDetails>
          <div data-testid="reservation__payment-notification__price">
            {t("common:price")}: {price}
            {taxPercentage != null && ` (${t("common:inclTax", { taxPercentage: taxPercentage })})`}
            {priceLineList.map((priceLine) => (
              <div key={priceLine}>{priceLine}</div>
            ))}
          </div>
          <div data-testid="reservation__payment-notification__deadline">
            {t("common:deadline")}: {deadline}
          </div>
          {!isExpired && (
            <ButtonLikeLink href={paymentUrl ?? ""} disabled={!paymentUrl} variant="primary" external>
              {t("reservation:payReservation")}
            </ButtonLikeLink>
          )}
        </PriceDetails>
      </Flex>
    </Notification>
  );
};
