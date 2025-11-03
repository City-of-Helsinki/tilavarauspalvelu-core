import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ControlledCheckbox } from "ui/src/components/form";
import { FormSubHeading } from "@/styled/application";
import { ApplicationFormTextInput, BillingAddress } from ".";
import { type ApplicationPage3FormValues } from "./form";

export function CompanyForm(): JSX.Element {
  const { t } = useTranslation();

  const { watch, control } = useFormContext<ApplicationPage3FormValues>();

  const hasBillingAddress = watch("hasBillingAddress");

  return (
    <>
      <ApplicationFormTextInput name="organisationName" />
      <ApplicationFormTextInput name="organisationCoreBusiness" />
      <ApplicationFormTextInput name="organisationIdentifier" />
      <FormSubHeading>{t("application:Page3.sectionHeadings.postalAddress")}</FormSubHeading>
      <ApplicationFormTextInput name="organisationStreetAddress" />
      <ApplicationFormTextInput name="organisationPostCode" />
      <ApplicationFormTextInput name="organisationCity" />
      <ControlledCheckbox
        control={control}
        label={t("application:Page3.organisationSeparateInvoicingAddress")}
        id="organisation.hasInvoicingAddress"
        name="hasBillingAddress"
      />
      {hasBillingAddress ? <BillingAddress /> : null}
      <ContactPersonSection />
    </>
  );
}

export function ContactPersonSection(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <FormSubHeading>{t("application:Page3.sectionHeadings.contactInfo")}</FormSubHeading>
      <ApplicationFormTextInput name="contactPersonFirstName" />
      <ApplicationFormTextInput name="contactPersonLastName" />
      <ApplicationFormTextInput name="contactPersonPhoneNumber" />
      <ApplicationFormTextInput name="contactPersonEmail" />
    </>
  );
}
