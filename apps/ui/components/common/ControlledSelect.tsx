import React from "react";
import { Select } from "hds-react";
import { useTranslation } from "next-i18next";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
  type UseControllerProps,
} from "react-hook-form";

interface Props<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Array<{ label: string; value: string | number }>;
  required?: boolean;
  placeholder?: string;
  error?: string;
  validate?: { [key: string]: (val: string) => boolean };
  style?: React.CSSProperties;
  className?: string;
  clearable?: boolean;
}

export function ControlledSelect<T extends FieldValues>({
  name,
  label,
  control,
  required,
  options,
  error,
  placeholder,
  validate,
  style,
  className,
  clearable,
}: Props<T>): JSX.Element {
  const { t } = useTranslation();
  const {
    field: { value, onChange },
  } = useController({ name, control, rules: { required, validate } });

  const currentValue = options.find((x) => x.value === value) ?? null;

  return (
    <Select
      id={name}
      style={style}
      className={className}
      clearable={clearable}
      value={currentValue}
      options={options}
      label={label}
      required={required}
      onChange={(selection?: (typeof options)[0]): void => {
        if (!clearable && !selection) {
          return;
        }
        onChange(selection?.value);
      }}
      placeholder={placeholder ?? t("common:select")}
      invalid={Boolean(error)}
      error={error}
    />
  );
}
