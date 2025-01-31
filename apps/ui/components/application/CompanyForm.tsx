import React from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { FormSubHeading } from "./styled";
import { BillingAddress } from "./BillingAddress";
import { ApplicationFormPage3Values } from "./form";
import { ControlledCheckbox } from "common/src/components/form/ControlledCheckbox";

export function CompanyForm(): JSX.Element {
  const { t } = useTranslation();

  const { watch, control } = useFormContext<ApplicationFormPage3Values>();

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

type TextFields =
  | "organisation.name"
  | "organisation.coreBusiness"
  | "organisation.identifier"
  | "organisation.address.streetAddress"
  | "organisation.address.postCode"
  | "organisation.address.city"
  | "contactPerson.firstName"
  | "contactPerson.lastName"
  | "contactPerson.phoneNumber"
  | "additionalInformation";
export function ApplicationFormTextInput({
  name,
  disabled,
}: {
  name: TextFields;
  disabled?: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const { register, getFieldState } =
    useFormContext<ApplicationFormPage3Values>();

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`application:validation.${errorMsg}`) : "";
  const state = getFieldState(name);

  return (
    <TextInput
      {...register(name)}
      label={t(`application:Page3.${name}`)}
      id={name}
      required={!disabled}
      disabled={disabled}
      invalid={!!state.error?.message}
      errorText={translateError(state.error?.message)}
    />
  );
}
