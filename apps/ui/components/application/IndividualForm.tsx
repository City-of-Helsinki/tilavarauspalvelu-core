import React from "react";
import { useTranslation } from "next-i18next";
import { FormSubHeading, SpanFullRow } from "./styled";
import { ApplicationFormTextInput, BillingAddress } from ".";

export function IndividualForm(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ApplicationFormTextInput name="contactPerson.firstName" />
      <ApplicationFormTextInput name="contactPerson.lastName" />
      <BillingAddress />
      <FormSubHeading as="h2">
        {t("application:Page3.sectionHeadings.contactInfo")}
      </FormSubHeading>
      <ApplicationFormTextInput name="contactPerson.phoneNumber" />
      <ApplicationFormTextInput name="contactPerson.email" />
      <SpanFullRow>
        <ApplicationFormTextInput name="additionalInformation" />
      </SpanFullRow>
    </>
  );
}
