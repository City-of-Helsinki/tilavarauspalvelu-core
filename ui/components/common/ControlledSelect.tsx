import React from "react";
import { Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { Controller, useForm } from "react-hook-form";
import { OptionType } from "common/types/common";
import { getSelectedOption } from "../../modules/util";

type Props = {
  name: string;
  label: string;
  control: ReturnType<typeof useForm>["control"];
  required: boolean;
  options: OptionType[];
  error?: string;
  validate?: { [key: string]: (val: string) => boolean };
};
const ControlledSelect = ({
  name,
  label,
  control,
  required,
  options,
  error,
  validate,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      rules={{ required, validate }}
      render={({ field }) => {
        const currentValue = getSelectedOption(field.value, options) ?? {
          label: "",
          value: "",
        };
        return (
          <Select
            id={name}
            value={currentValue}
            placeholder={t("common:select")}
            options={options}
            label={label}
            required={required}
            onChange={(selection: OptionType): void => {
              field.onChange(selection.value);
            }}
            invalid={Boolean(error)}
            error={error}
          />
        );
      }}
    />
  );
};

export default ControlledSelect;
