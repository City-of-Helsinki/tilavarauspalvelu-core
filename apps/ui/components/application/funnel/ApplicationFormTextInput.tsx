import React from "react";
import { TextInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { useFormContext } from "react-hook-form";
import type { ApplicationPage3FormValues } from "./form";

type TextFields =
  | "organisationName"
  | "organisationCoreBusiness"
  | "organisationIdentifier"
  | "organisationStreetAddress"
  | "organisationPostCode"
  | "organisationCity"
  | "contactPersonFirstName"
  | "contactPersonLastName"
  | "contactPersonPhoneNumber"
  | "contactPersonEmail"
  | "billingStreetAddress"
  | "billingPostCode"
  | "billingCity"
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

  return (
    <TextInput
      {...register(name)}
      label={t(`application:Page3.${name}`)}
      id={name}
      required={!disabled}
      disabled={disabled}
      invalid={state.invalid}
      errorText={translateError(state.error?.message)}
    />
  );
}
