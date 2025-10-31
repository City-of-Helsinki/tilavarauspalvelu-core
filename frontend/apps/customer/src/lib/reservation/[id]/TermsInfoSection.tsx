import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { Sanitize } from "ui/src/components/Sanitize";
import { getTranslation } from "ui/src/modules/util";
import { getLocalizationLang } from "@ui/modules/helpers";
import { AccordionWithState as Accordion } from "@/components/Accordion";
import { isReservationUnitFreeOfCharge } from "@/modules/reservationUnit";
import { getServerSideProps } from "@/pages/reservations/[id]";
import type { ReservationPageQuery } from "@gql/gql-types";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;
type NodeT = NonNullable<ReservationPageQuery["reservation"]>;

export function TermsInfoSection({
  reservation,
  termsOfUse,
}: Readonly<{
  reservation: Pick<NodeT, "reservationUnit" | "beginsAt" | "applyingForFreeOfCharge">;
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

  const lang = getLocalizationLang(i18n.language);
  const paymentTermsContent =
    reservationUnit.paymentTerms != null ? getTranslation(reservationUnit.paymentTerms, "text", lang) : undefined;
  const cancellationTermsContent =
    reservationUnit.cancellationTerms != null
      ? getTranslation(reservationUnit.cancellationTerms, "text", lang)
      : undefined;
  const pricingTermsContent =
    reservationUnit.pricingTerms != null ? getTranslation(reservationUnit.pricingTerms, "text", lang) : undefined;
  const serviceSpecificTermsContent =
    reservationUnit.serviceSpecificTerms != null
      ? getTranslation(reservationUnit.serviceSpecificTerms, "text", lang)
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
        {termsOfUse?.genericTerms != null && <Sanitize html={getTranslation(termsOfUse.genericTerms, "text", lang)} />}
      </Accordion>
    </div>
  );
}
