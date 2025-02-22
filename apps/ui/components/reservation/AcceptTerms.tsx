import React from "react";
import TermsBox from "common/src/termsbox/TermsBox";
import { useTranslation } from "next-i18next";
import { getTranslation } from "@/modules/util";
import { Sanitize } from "common/src/components/Sanitize";
import { type TermsOfUseFragment } from "@/gql/gql-types";
import { Flex } from "common/styles/util";

export function AcceptTerms({
  reservationUnit,
  isTermsAccepted,
  setIsTermsAccepted,
}: {
  reservationUnit: Pick<
    TermsOfUseFragment,
    "cancellationTerms" | "paymentTerms" | "serviceSpecificTerms"
  >;
  isTermsAccepted: { space: boolean; service: boolean };
  setIsTermsAccepted: (key: "space" | "service", val: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();
  const { cancellationTerms, paymentTerms, serviceSpecificTerms } =
    reservationUnit;

  const paymentTermsHeading = t(
    `reservationCalendar:heading.${
      cancellationTerms && paymentTerms
        ? "cancellationPaymentTerms"
        : cancellationTerms
          ? "cancellationTerms"
          : "paymentTerms"
    }`
  );
  const paymentTermsAcceptLabel = t(
    `reservationCalendar:label.${
      cancellationTerms && paymentTerms
        ? "termsCancellationPayment"
        : cancellationTerms
          ? "termsCancellation"
          : "termsPayment"
    }`
  );
  const serviceSpecificAcceptLabel = t(
    `reservationCalendar:label.${
      serviceSpecificTerms ? "termsGeneralSpecific" : "termsGeneral"
    }`
  );

  return (
    <Flex>
      <TermsBox
        id="cancellation-and-payment-terms"
        heading={paymentTermsHeading}
        body={
          <>
            {cancellationTerms != null && (
              <Sanitize html={getTranslation(cancellationTerms, "text")} />
            )}
            <br />
            {reservationUnit.paymentTerms != null && (
              <Sanitize
                html={getTranslation(reservationUnit.paymentTerms, "text")}
              />
            )}
          </>
        }
        acceptLabel={paymentTermsAcceptLabel}
        accepted={isTermsAccepted.service}
        setAccepted={(val) => setIsTermsAccepted("service", val)}
      />
      <TermsBox
        id="generic-and-service-specific-terms"
        heading={t("reservationCalendar:heading.termsOfUse")}
        body={
          serviceSpecificTerms != null ? (
            <Sanitize html={getTranslation(serviceSpecificTerms, "text")} />
          ) : (
            <span />
          )
        }
        links={[
          {
            href: "/terms/booking",
            text: t("reservationCalendar:heading.generalTerms"),
          },
        ]}
        acceptLabel={serviceSpecificAcceptLabel}
        accepted={isTermsAccepted.space}
        setAccepted={(val) => setIsTermsAccepted("space", val)}
      />
    </Flex>
  );
}
