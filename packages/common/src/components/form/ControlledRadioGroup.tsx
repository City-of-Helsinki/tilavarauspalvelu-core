import React from "react";
import { useTranslation } from "next-i18next";
import { useController } from "react-hook-form";
import type { Control, FieldValues, Path, UseControllerProps } from "react-hook-form";
import { RadioButton, SelectionGroup } from "hds-react";

interface RadioGroupProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
  options: Array<{ label: string; value: string | number }>;
  direction?: "horizontal" | "vertical";
  required?: boolean;
  tooltip?: string;
  label?: string;
  noTranslation?: boolean; // Prevent translation of labels
  error?: string;
}

export function ControlledRadioGroup<T extends FieldValues>({
  name,
  options,
  control,
  direction,
  required,
  label,
  tooltip,
  noTranslation,
  error,
}: RadioGroupProps<T>): JSX.Element {
  const { t } = useTranslation();
  const { field } = useController({ name, control });

  return (
    <SelectionGroup label={label} tooltipText={tooltip} required={required} direction={direction} errorText={error}>
      {options.map((opt) => (
        <RadioButton
          id={`${name}.${opt.label}`}
          key={opt.label}
          style={{ margin: 0 }}
          label={noTranslation ? opt.label : t(opt.label)}
          onChange={() => field.onChange(opt.value)}
          checked={field.value === opt.value}
        />
      ))}
    </SelectionGroup>
  );
}
