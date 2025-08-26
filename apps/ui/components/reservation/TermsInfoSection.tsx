import { useTranslation } from "next-i18next";
import React, { useMemo } from "react";
import { isReservationUnitFreeOfCharge } from "@/modules/reservationUnit";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import { Sanitize } from "common/src/components/Sanitize";
import type { TermsInfoSectionFragment } from "@gql/gql-types";
import { getServerSideProps } from "@/pages/reservations/[id]";
import { gql } from "@apollo/client";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export function TermsInfoSection({
  reservation,
  termsOfUse,
}: Readonly<{
  reservation: TermsInfoSectionFragment;
  termsOfUse: PropsNarrowed["termsOfUse"];
}>) {
  const { t, i18n } = useTranslation();
  const reservationUnit = reservation.reservationUnit;

  const shouldDisplayPricingTerms: boolean = useMemo(() => {
    if (!reservationUnit) {
      return false;
    }
    const isFreeOfCharge = isReservationUnitFreeOfCharge(reservationUnit.pricings, new Date(reservation.beginsAt));
    return reservation.applyingForFreeOfCharge || (reservationUnit.canApplyFreeOfCharge && !isFreeOfCharge);
  }, [reservation, reservationUnit]);

  const lang = convertLanguageCode(i18n.language);
  const paymentTermsContent =
    reservationUnit.paymentTerms != null ? getTranslationSafe(reservationUnit.paymentTerms, "text", lang) : undefined;
  const cancellationTermsContent =
    reservationUnit.cancellationTerms != null
      ? getTranslationSafe(reservationUnit.cancellationTerms, "text", lang)
      : undefined;
  const pricingTermsContent =
    reservationUnit.pricingTerms != null ? getTranslationSafe(reservationUnit.pricingTerms, "text", lang) : undefined;
  const serviceSpecificTermsContent =
    reservationUnit.serviceSpecificTerms != null
      ? getTranslationSafe(reservationUnit.serviceSpecificTerms, "text", lang)
      : undefined;

  return (
    <div>
      {(paymentTermsContent || cancellationTermsContent) && (
        <Accordion
          heading={t(`reservationUnit:${paymentTermsContent ? "paymentAndCancellationTerms" : "cancellationTerms"}`)}
          theme="thin"
          data-testid="reservation__payment-and-cancellation-terms"
        >
          {paymentTermsContent && <Sanitize html={paymentTermsContent} />}
          {cancellationTermsContent && <Sanitize html={cancellationTermsContent} />}
        </Accordion>
      )}
      {shouldDisplayPricingTerms && pricingTermsContent && (
        <Accordion heading={t("reservationUnit:pricingTerms")} theme="thin" data-testid="reservation__pricing-terms">
          <Sanitize html={pricingTermsContent} />
        </Accordion>
      )}
      <Accordion heading={t("reservationUnit:termsOfUse")} theme="thin" data-testid="reservation__terms-of-use">
        {serviceSpecificTermsContent && <Sanitize html={serviceSpecificTermsContent} />}
        {termsOfUse?.genericTerms != null && (
          <Sanitize html={getTranslationSafe(termsOfUse.genericTerms, "text", lang)} />
        )}
      </Accordion>
    </div>
  );
}

export const TERMS_INFO_SECTION_FRAGMENT = gql`
  fragment TermsInfoSection on ReservationNode {
    id
    applyingForFreeOfCharge
    beginsAt
    reservationUnit {
      pricings {
        ...PricingFields
      }
      canApplyFreeOfCharge
      ...TermsOfUse
    }
  }
`;
