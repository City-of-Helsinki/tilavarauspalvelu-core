import React from 'react';
import { Select } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { OptionType } from '../common/types';
import { getSelectedOption } from '../common/util';

type Props = {
  name: string;
  label: string;
  control: ReturnType<typeof useForm>['control'];
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
      onFocus={() => {
        document.getElementById(`${name}-toggle-button`)?.focus();
      }}
      render={(props) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ref, value, ...newProps } = props;
        const currentValue = getSelectedOption(value, options);
        return (
          <Select
            {...newProps}
            id={name}
            value={currentValue}
            placeholder={t('common.select')}
            options={options}
            label={label}
            required={required}
            onChange={(selection: OptionType): void => {
              newProps.onChange(selection.value);
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
