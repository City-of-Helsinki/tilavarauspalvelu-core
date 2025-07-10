import React from "react";
import { addYears } from "date-fns";
import { DateInput } from "hds-react";
import { type FieldValues, useController, type UseControllerProps } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { startOfDay } from "date-fns/startOfDay";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  label?: string;
  maxDate?: Date;
  minDate?: Date;
  initialMonth?: Date;
  disableConfirmation?: boolean;
}

// NOTE string version because Date breaks keyboard input
export function ControlledDateInput<T extends FieldValues>({
  control,
  name,
  error,
  required,
  disabled,
  id,
  label,
  maxDate,
  minDate,
  initialMonth,
  disableConfirmation,
  ...rest
}: ControllerProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name, rules: { required } });
  const { t } = useTranslation();

  return (
    <DateInput
      {...rest}
      id={id ?? `controlled-date-input__${name}`}
      label={label ?? t(`common.${name}`)}
      minDate={startOfDay(minDate ?? new Date())}
      maxDate={maxDate ?? addYears(new Date(), 2)}
      initialMonth={initialMonth}
      disableConfirmation={disableConfirmation ?? false}
      language="fi"
      value={value}
      errorText={error}
      onChange={(text) => onChange(text)}
      required={required}
      disabled={disabled}
    />
  );
}
