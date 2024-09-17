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
  tooltip?: string;
  helper?: string;
  multiselect?: boolean;
  disabled?: boolean;
  afterChange?: (
    value: string | number | Array<string | number> | undefined
  ) => void;
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
  tooltip,
  helper,
  multiselect,
  disabled,
  afterChange,
}: Props<T>): JSX.Element {
  const { t } = useTranslation(["common"]);
  const {
    field: { value, onChange },
  } = useController({ name, control, rules: { required, validate } });

  const currentValue = multiselect
    ? options.filter((x) => value.includes(x.value))
    : (options.find((x) => x.value === value) ?? null);

  type OptionT = (typeof options)[0];
  const handleChange = (selection?: OptionT | OptionT[]) => {
    if (!clearable && selection == null) {
      return;
    }
    if (multiselect && Array.isArray(selection)) {
      const v = selection.map((x) => x.value);
      onChange(v);
      afterChange?.(v);
    } else if (Array.isArray(selection)) {
      onChange(selection[0]?.value);
      afterChange?.(selection[0]?.value);
    } else {
      onChange(selection?.value);
      afterChange?.(selection?.value);
    }
  };

  // Type check mess because we can switch between multislect and single select
  // might be better to split them into separate components
  if (multiselect) {
    if (!Array.isArray(currentValue)) {
      throw new Error("Multiselect requires an array value");
    }
    return (
      <Select<OptionT>
        id={name}
        style={style}
        className={className}
        clearable={clearable}
        value={currentValue ?? []}
        options={options}
        label={label}
        required={required}
        onChange={handleChange}
        clearButtonAriaLabel={t("common:clear")}
        selectedItemRemoveButtonAriaLabel={t("common:remove")}
        placeholder={placeholder ?? t("common:select")}
        invalid={Boolean(error)}
        error={error}
        tooltipText={tooltip}
        helper={helper}
        multiselect
        disabled={disabled ?? options.length === 0}
      />
    );
  }

  if (Array.isArray(currentValue)) {
    throw new Error("Single select requires a single value");
  }

  return (
    <Select<OptionT>
      id={name}
      style={style}
      className={className}
      clearable={clearable}
      value={currentValue}
      options={options}
      label={label}
      required={required}
      onChange={handleChange}
      clearButtonAriaLabel={t("common:clear")}
      selectedItemRemoveButtonAriaLabel={t("common:remove")}
      placeholder={placeholder ?? t("common:select")}
      invalid={Boolean(error)}
      error={error}
      tooltipText={tooltip}
      helper={helper}
      disabled={disabled ?? options.length === 0}
    />
  );
}
