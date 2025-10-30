import React from "react";
import TermsBox from "ui/src/components/TermsBox";
import { useTranslation } from "next-i18next";
import { Sanitize } from "ui/src/components/Sanitize";
import { type TermsOfUseTextFieldsFragment, type Maybe, type TermsOfUseFragment } from "@gql/gql-types";
import { convertLanguageCode, getTranslationSafe } from "ui/src/modules/util";

export function AcceptTerms({
  reservationUnit,
  isTermsAccepted,
  setIsTermsAccepted,
}: {
  reservationUnit: Pick<TermsOfUseFragment, "cancellationTerms" | "paymentTerms" | "serviceSpecificTerms">;
  isTermsAccepted: { space: boolean; service: boolean };
  setIsTermsAccepted: (key: "space" | "service", val: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();

  const { cancellationTerms, paymentTerms, serviceSpecificTerms } = reservationUnit;

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
    `reservationCalendar:label.${serviceSpecificTerms ? "termsGeneralSpecific" : "termsGeneral"}`
  );

  return (
    <>
      <TermsBox
        id="cancellation-and-payment-terms"
        heading={paymentTermsHeading}
        body={
          <>
            <SanitizedTerms terms={cancellationTerms} />
            <br />
            <SanitizedTerms terms={paymentTerms} />
          </>
        }
        acceptLabel={paymentTermsAcceptLabel}
        accepted={isTermsAccepted.service}
        setAccepted={(val) => setIsTermsAccepted("service", val)}
      />
      <TermsBox
        id="generic-and-service-specific-terms"
        heading={t("reservationCalendar:heading.termsOfUse")}
        body={<SanitizedTerms terms={serviceSpecificTerms} returnEmpty />}
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
    </>
  );
}

function SanitizedTerms({
  terms,
  returnEmpty,
}: {
  terms: Maybe<TermsOfUseTextFieldsFragment> | undefined;
  returnEmpty?: boolean;
}): JSX.Element | null {
  const { i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  if (terms == null && returnEmpty) {
    return <span />;
  } else if (terms == null) {
    return null;
  }

  const localTerms = getTranslationSafe(terms, "text", lang);
  return <Sanitize html={localTerms} />;
}
