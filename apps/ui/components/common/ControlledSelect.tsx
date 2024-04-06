import React from "react";
import { Select } from "hds-react";
import { useTranslation } from "next-i18next";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from "react-hook-form";

type Props<T extends FieldValues, U> = {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Array<{ label: string; value: U }>;
  required?: boolean;
  placeholder?: string;
  error?: string;
  validate?: { [key: string]: (val: string) => boolean };
  style?: React.CSSProperties;
  className?: string;
  clearable?: boolean;
};

export function ControlledSelect<
  T extends FieldValues,
  U extends number | string,
>({
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
}: Props<T, U>): JSX.Element {
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
        onChange(selection?.value);
      }}
      placeholder={placeholder ?? t("common:select")}
      invalid={Boolean(error)}
      error={error}
    />
  );
}
