import React from "react";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";
import { RadioButton, SelectionGroup } from "hds-react";
import { useTranslation } from "next-i18next";
import { filterEmpty } from "../../modules/helpers";

interface RadioGroupProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
  options: { label: string; value: string | number }[];
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

  const errorText = filterEmpty(error) ?? undefined;
  return (
    <SelectionGroup label={label} tooltipText={tooltip} required={required} direction={direction} errorText={errorText}>
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
