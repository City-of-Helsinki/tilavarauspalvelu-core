import React from "react";
import { useTranslation } from "next-i18next";
import { ApplicationFormTextInput } from "@/components/application/funnel/ApplicationFormTextInput";
import { FormSubHeading } from "@/styled/application";

export function BillingAddress() {
  const { t } = useTranslation();

  return (
    <>
      <FormSubHeading as="h2">{t("application:Page3.sectionHeadings.billingAddress")}</FormSubHeading>
      <ApplicationFormTextInput name="billingStreetAddress" />
      <ApplicationFormTextInput name="billingPostCode" />
      <ApplicationFormTextInput name="billingCity" />
    </>
  );
}
