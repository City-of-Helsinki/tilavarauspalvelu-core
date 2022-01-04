import React from "react";
import { Select as HDSSelect } from "hds-react";
import { OptionType } from "../../common/types";

const getSelectedOption = (
  options: OptionType[],
  value: string | number
): OptionType => options.find((o) => o.value === value) || ({} as OptionType);

const Select = ({
  id,
  label,
  onChange,
  required = false,
  value,
  options,
  placeholder,
  helper,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string | number;
  onChange: (value: string | number) => void;
  options: OptionType[];
  placeholder?: string;
  helper?: string;
}): JSX.Element => {
  return (
    <HDSSelect
      style={{ paddingBottom: "var(--spacing-m)" }}
      id={id}
      label={label}
      placeholder={placeholder}
      options={options}
      required={required}
      onChange={(e: OptionType) => {
        if (e.value) {
          onChange(e.value);
        }
      }}
      disabled={options.length === 0}
      helper={helper}
      value={getSelectedOption(options, value)}
    />
  );
};

export default Select;
