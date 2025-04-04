import React from "react";
import { useTranslation } from "next-i18next";
import { BillingAddress } from "./BillingAddress";
import { FormSubHeading, SpanFullRow } from "./styled";
import { ApplicationFormTextInput } from "./ApplicationFormTextInput";

export function IndividualForm(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <ApplicationFormTextInput name="contactPerson.firstName" />
      <ApplicationFormTextInput name="contactPerson.lastName" />
      <BillingAddress />
      <FormSubHeading as="h2">
        {t("application:Page3.subHeading.contactInfo")}
      </FormSubHeading>
      <ApplicationFormTextInput name="contactPerson.phoneNumber" />
      <ApplicationFormTextInput name="contactPerson.email" />
      <SpanFullRow>
        <ApplicationFormTextInput name="additionalInformation" />
      </SpanFullRow>
    </>
  );
}
