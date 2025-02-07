import React from "react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { FormSubHeading } from "./styled";
import { BillingAddress } from "./BillingAddress";
import { type ApplicationPage3FormValues } from "./form";
import { ControlledCheckbox } from "common/src/components/form/ControlledCheckbox";
import { ApplicationFormTextInput } from "./ApplicationFormTextInput";

export function CompanyForm(): JSX.Element {
  const { t } = useTranslation();

  const { watch, control } = useFormContext<ApplicationPage3FormValues>();

  const hasBillingAddress = watch("hasBillingAddress");

  return (
    <>
      <ApplicationFormTextInput name="organisation.name" />
      <ApplicationFormTextInput name="organisation.coreBusiness" />
      <ApplicationFormTextInput name="organisation.identifier" />
      <FormSubHeading>
        {t("application:Page3.subHeading.postalAddress")}
      </FormSubHeading>
      <ApplicationFormTextInput name="organisation.address.streetAddress" />
      <ApplicationFormTextInput name="organisation.address.postCode" />
      <ApplicationFormTextInput name="organisation.address.city" />
      <ControlledCheckbox
        control={control}
        label={t("application:Page3.organisation.separateInvoicingAddress")}
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
      <FormSubHeading>
        {t("application:Page3.subHeading.contactInfo")}
      </FormSubHeading>
      <ApplicationFormTextInput name="contactPerson.firstName" />
      <ApplicationFormTextInput name="contactPerson.lastName" />
      <ApplicationFormTextInput name="contactPerson.phoneNumber" />
    </>
  );
}
