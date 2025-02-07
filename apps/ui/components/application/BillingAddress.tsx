import React from "react";
import { useTranslation } from "next-i18next";
import { FormSubHeading } from "./styled";
import { ApplicationFormTextInput } from "./ApplicationFormTextInput";

export function BillingAddress() {
  const { t } = useTranslation();

  return (
    <>
      <FormSubHeading as="h2">
        {t("application:Page3.subHeading.billingAddress")}
      </FormSubHeading>
      <ApplicationFormTextInput name="billingAddress.streetAddress" />
      <ApplicationFormTextInput name="billingAddress.postCode" />
      <ApplicationFormTextInput name="billingAddress.city" />
    </>
  );
}
