// Wrapper around NumberInput so it sends nulls instead of NaNs
import React from "react";
import { NumberInput } from "hds-react";
import {
  type FieldValues,
  Controller,
  UseControllerProps,
} from "react-hook-form";
import { useTranslation } from "next-i18next";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  min?: number;
  max?: number;
  required?: boolean;
  label: string;
  tooltipText?: string;
  helperText?: string;
  errorText?: string;
}

// set some page specific defaults for translations
export function ControlledNumberInput<T extends FieldValues>({
  control,
  name,
  min,
  max,
  required,
  label,
  tooltipText,
  helperText,
  errorText,
}: ControllerProps<T>) {
  const { t } = useTranslation();

  // NOTE controller is needed otherwise the values default to 0 instead of null
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <NumberInput
          value={value ?? ""}
          onChange={(e) =>
            onChange(
              e.target.value === "" ? null : parseInt(e.target.value, 10)
            )
          }
          required={required}
          id={name}
          label={label}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          step={1}
          type="number"
          min={min}
          max={max}
          helperText={helperText}
          errorText={errorText}
          invalid={errorText != null}
          tooltipText={tooltipText}
        />
      )}
    />
  );
}
