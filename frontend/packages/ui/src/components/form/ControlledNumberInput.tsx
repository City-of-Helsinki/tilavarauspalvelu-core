// Wrapper around NumberInput so it sends nulls instead of NaNs.
// It has no step prop, because HDS then shows the -/+ buttons and they do not help the user.
import React from "react";
import { useController } from "react-hook-form";
import type { FieldValues, UseControllerProps } from "react-hook-form";
import { NumberInput, Tooltip } from "hds-react";
import { filterEmpty, toNumber } from "../../modules/helpers";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  id?: string;
  min?: number;
  max?: number;
  // block the keys that type a non-integer, and the minus sign if min is not negative
  integerOnly?: boolean;
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
  id,
  control,
  name,
  min,
  max,
  integerOnly,
  required,
  label,
  helperText,
  errorText,
  afterChange,
  style,
  className,
  tooltipText,
}: ControllerProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name, rules: { required } });

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const val = toNumber(evt.target.value);
    onChange(val);
    afterChange?.(val);
  };

  const handleKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
    if (!integerOnly) {
      return;
    }
    const blockedKeys = [".", ",", "e", "E", "+"];
    if (min != null && min >= 0) {
      blockedKeys.push("-");
    }
    if (blockedKeys.includes(evt.key)) {
      evt.preventDefault();
    }
  };

  // NOTE controller is needed otherwise the values default to 0 instead of null
  return (
    <NumberInput
      value={value ?? ""}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      required={required}
      id={id ?? name}
      label={label}
      type="number"
      min={min}
      max={max}
      helperText={helperText}
      errorText={filterEmpty(errorText) ?? undefined}
      invalid={filterEmpty(errorText) != null}
      style={style}
      className={className}
      tooltip={tooltipText != null && tooltipText !== "" ? <Tooltip>{tooltipText}</Tooltip> : undefined}
    />
  );
}
