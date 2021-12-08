import React from "react";
import { Select } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

type OptionType = {
  label: string;
  value: string;
};

const StyledSelect = styled(Select)`
  padding-bottom: var(--spacing-m);
`;

const EnumSelect = ({
  id,
  label,
  onChange,
  required = false,
  value,
  type,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  type: { [key: string]: string };
}): JSX.Element => {
  const { t } = useTranslation();
  const options: OptionType[] = Object.keys(type).map((key) => ({
    value: type[key],
    label: t(`${id}.${type[key]}`),
  }));

  return (
    <StyledSelect
      label={label}
      required={required}
      options={options}
      value={options.find((o) => o.value === value)}
      id={id}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange={(e: any) => {
        onChange(e.value);
      }}
    />
  );
};

export default EnumSelect;
