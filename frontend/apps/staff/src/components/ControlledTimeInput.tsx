import React from "react";
import { useController, UseControllerProps, FieldValues } from "react-hook-form";
import { TimeInput } from "hds-react";
import { useTranslation } from "next-i18next";
import { filterEmpty } from "ui/src/modules/helpers";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  error?: string;
  required?: boolean;
  disabled?: boolean;
  testId?: string;
  label?: string;
  id?: string;
}

export function ControlledTimeInput<T extends FieldValues>({
  name,
  control,
  error,
  required,
  disabled,
  testId,
  label,
  id,
}: ControllerProps<T>) {
  const { t } = useTranslation();
  const { field } = useController({ control, name, rules: { required } });

  return (
    <TimeInput
      id={id ?? `TimeInput.${field.name}`}
      label={label ?? t(`common:${field.name}`)}
      hoursLabel={t("common:hoursLabel")}
      minutesLabel={t("common:minutesLabel")}
      required={required}
      disabled={disabled}
      errorText={filterEmpty(error) ?? undefined}
      invalid={filterEmpty(error) != null}
      onChange={field.onChange}
      value={field.value}
      data-testid={testId}
    />
  );
}
