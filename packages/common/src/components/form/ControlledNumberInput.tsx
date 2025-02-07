// Wrapper around NumberInput so it sends nulls instead of NaNs
import React from "react";
import { NumberInput } from "hds-react";
import {
  type FieldValues,
  useController,
  UseControllerProps,
} from "react-hook-form";
import { useTranslation } from "next-i18next";
import { toNumber } from "../../helpers";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  min?: number;
  max?: number;
  required?: boolean;
  label: string;
  tooltipText?: string;
  helperText?: string;
  errorText?: string;
  afterChange?: (value: number | null) => void;
  style?: React.CSSProperties;
  className?: string;
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
  afterChange,
  style,
  className,
}: ControllerProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name, rules: { required } });
  const { t } = useTranslation();

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const val = toNumber(evt.target.value);
    onChange(val);
    afterChange?.(val);
  };

  // NOTE controller is needed otherwise the values default to 0 instead of null
  return (
    <NumberInput
      value={value ?? ""}
      onChange={handleChange}
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
      style={style}
      className={className}
    />
  );
}
