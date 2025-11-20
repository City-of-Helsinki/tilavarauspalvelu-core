import React from "react";
import { useTranslation } from "next-i18next";
import { Sanitize } from "ui/src/components/Sanitize";
import TermsBox from "ui/src/components/TermsBox";
import { getLocalizationLang, getTranslation } from "@ui/modules/helpers";
import { type Maybe, type TermsOfUseTextFieldsFragment } from "@gql/gql-types";

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
  const lang = getLocalizationLang(i18n.language);
  return (
    <>
      {generalTos && (
        <TermsBox
          id="preview.acceptTermsOfUse"
          heading={t("reservationCalendar:heading.cancellationPaymentTerms")}
          body={<Sanitize html={getTranslation(generalTos, "text", lang)} />}
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
          body={<Sanitize html={getTranslation(serviceTos, "text", lang)} />}
          acceptLabel={t("application:preview.userAcceptsSpecificTerms")}
          accepted={isTermsAccepted?.specific}
          data-testid="terms-box__container--service-specific-terms"
          setAccepted={setIsTermsAccepted ? (val) => setIsTermsAccepted("specific", val) : undefined}
        />
      )}
    </>
  );
}
