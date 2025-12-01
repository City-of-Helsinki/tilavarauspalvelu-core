import React from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ControlledTextInput } from "@ui/components/form/ControlledTextInput";
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

export function ApplicationFormTextInput({
  name,
  disabled,
  maxLength,
}: {
  name: TextFields;
  disabled?: boolean;
  maxLength?: number;
}): JSX.Element {
  const { t } = useTranslation();
  const { control, getFieldState, formState } = useFormContext<ApplicationPage3FormValues>();
  // NOTE getFieldState does not update unless we extract formState also
  // but using errors is too difficult for nested fields
  const { errors: _ } = formState;

  const translateError = (errorMsg?: string) => (errorMsg ? t(`application:validation.${errorMsg}`) : "");
  const state = getFieldState(name);

  return (
    <ControlledTextInput
      id={name}
      control={control}
      name={name}
      label={t(`application:Page3.${name}`)}
      required={!disabled}
      disabled={disabled}
      invalid={state.invalid}
      errorText={translateError(state.error?.message)}
      max={maxLength}
    />
  );
}
