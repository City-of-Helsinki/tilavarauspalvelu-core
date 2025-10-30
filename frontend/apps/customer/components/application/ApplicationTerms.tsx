import React from "react";
import { useTranslation } from "next-i18next";
import { type Maybe, type TermsOfUseTextFieldsFragment } from "@/gql/gql-types";
import { convertLanguageCode, getTranslationSafe } from "ui/src/modules/util";
import { Sanitize } from "ui/src/components/Sanitize";
import TermsBox from "ui/src/components/TermsBox";

type ApplicationTermsProps = {
  generalTos: Maybe<TermsOfUseTextFieldsFragment>;
  serviceTos: Maybe<TermsOfUseTextFieldsFragment>;
  isTermsAccepted?: { general: boolean; specific: boolean };
  setIsTermsAccepted?: (key: "general" | "specific", val: boolean) => void;
};

export function ApplicationTerms({
  generalTos,
  serviceTos,
  isTermsAccepted,
  setIsTermsAccepted,
}: ApplicationTermsProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  return (
    <>
      {generalTos && (
        <TermsBox
          id="preview.acceptTermsOfUse"
          heading={t("reservationCalendar:heading.cancellationPaymentTerms")}
          body={<Sanitize html={getTranslationSafe(generalTos, "text", lang)} />}
          acceptLabel={t("application:preview.userAcceptsGeneralTerms")}
          data-testid="terms-box__container--general-terms"
          accepted={isTermsAccepted?.general}
          setAccepted={setIsTermsAccepted ? (val) => setIsTermsAccepted("general", val) : undefined}
        />
      )}
      {serviceTos && (
        <TermsBox
          id="preview.acceptServiceSpecificTerms"
          heading={t("reservationCalendar:heading.termsOfUse")}
          body={<Sanitize html={getTranslationSafe(serviceTos, "text", lang)} />}
          acceptLabel={t("application:preview.userAcceptsSpecificTerms")}
          accepted={isTermsAccepted?.specific}
          data-testid="terms-box__container--service-specific-terms"
          setAccepted={setIsTermsAccepted ? (val) => setIsTermsAccepted("specific", val) : undefined}
        />
      )}
    </>
  );
}
