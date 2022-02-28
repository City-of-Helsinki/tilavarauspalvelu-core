import React from "react";
import { Select } from "hds-react";
import { useTranslation } from "react-i18next";

type OptionType = {
  label: string;
  value: string;
};

const EnumSelect = ({
  id,
  label,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  value,
  type,
  errorText,
}: {
  id: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type: { [key: string]: string };
  errorText?: string;
}): JSX.Element => {
  const { t } = useTranslation();
  const options: OptionType[] = Object.keys(type).map((key) => ({
    value: type[key],
    label: t(`${id}.${type[key]}`),
  }));

  return (
    <Select
      label={label}
      required={required}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      value={options.find((o) => o.value === value) || ""}
      id={id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange={(e: any) => {
        onChange(e.value);
      }}
      error={errorText}
      invalid={!!errorText}
    />
  );
};

export default EnumSelect;
