import React from "react";
import { useTranslation } from "next-i18next/pages";
import { ApplicationFormTextInput } from "@/components/application/funnel/ApplicationFormTextInput";
import { BillingAddress } from "@/components/application/funnel/BillingAddress";
import { FormSubHeading, SpanFullRow } from "@/styled/application";

export function IndividualForm(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <ApplicationFormTextInput name="contactPersonFirstName" label={t("application:Page3.firstName")} />
      <ApplicationFormTextInput name="contactPersonLastName" label={t("application:Page3.lastName")} />
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
