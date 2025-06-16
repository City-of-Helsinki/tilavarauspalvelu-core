import React from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import { type ApplicationPage3FormValues } from "./form";

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
  | "contactPerson.email"
  | "billingAddress.streetAddress"
  | "billingAddress.postCode"
  | "billingAddress.city"
  | "additionalInformation";
export function ApplicationFormTextInput({ name, disabled }: { name: TextFields; disabled?: boolean }): JSX.Element {
  const { t } = useTranslation();
  const { control, getFieldState, formState } = useFormContext<ApplicationPage3FormValues>();
  // NOTE getFieldState does not update unless we extract formState also
  // but using errors is too difficult for nested fields
  const { errors: _ } = formState;

  const { register } = control;

  const translateError = (errorMsg?: string) => (errorMsg ? t(`application:validation.${errorMsg}`) : "");
  const state = getFieldState(name);

  // avoid duplicating the translation key without polluting the props for a single case
  const transformedLabel = name.replace("organisation.address.", "billingAddress.");

  return (
    <TextInput
      {...register(name)}
      label={t(`application:Page3.${transformedLabel}`)}
      id={name}
      required={!disabled}
      disabled={disabled}
      invalid={state.invalid}
      errorText={translateError(state.error?.message)}
    />
  );
}
