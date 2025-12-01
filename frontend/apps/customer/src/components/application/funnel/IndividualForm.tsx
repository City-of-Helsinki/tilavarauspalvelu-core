import React from "react";
import { useTranslation } from "next-i18next";
import { ApplicationFormTextInput } from "@/components/application/funnel/ApplicationFormTextInput";
import { BillingAddress } from "@/components/application/funnel/BillingAddress";
import { FormSubHeading, SpanFullRow } from "@/styled/application";

export function IndividualForm(): JSX.Element {
  const { t } = useTranslation();
  return (
    <>
      <ApplicationFormTextInput name="contactPersonFirstName" />
      <ApplicationFormTextInput name="contactPersonLastName" />
      <BillingAddress />
      <FormSubHeading as="h2">{t("application:Page3.sectionHeadings.contactInfo")}</FormSubHeading>
      <ApplicationFormTextInput name="contactPersonPhoneNumber" />
      <ApplicationFormTextInput name="contactPersonEmail" />
      <SpanFullRow>
        <ApplicationFormTextInput name="additionalInformation" maxLength={255} />
      </SpanFullRow>
    </>
  );
}
