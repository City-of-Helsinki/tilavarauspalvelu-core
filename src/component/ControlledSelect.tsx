import React from 'react';
import { Select } from 'hds-react';
import { Controller, useForm } from 'react-hook-form';
import { OptionType } from '../common/types';
import { getSelectedOption } from '../common/util';

type Props = {
  name: string;
  label: string;
  control: ReturnType<typeof useForm>['control'];
  required: boolean;
  options: OptionType[];
};
const ControlledSelect = ({
  name,
  label,
  control,
  required,
  options,
}: Props): JSX.Element => (
  <Controller
    control={control}
    name={name}
    rules={{ required }}
    onFocus={() => {
      document.getElementById(`${name}-toggle-button`)?.focus();
    }}
    render={(props) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ref, value, ...newProps } = props;
      const defaultValue = getSelectedOption(value, options);
      return (
        <Select
          {...newProps}
          id={name}
          placeholder="Valitse"
          options={options}
          label={label}
          required={required}
          onChange={(selection: OptionType): void => {
            newProps.onChange(selection.value);
          }}
          defaultValue={defaultValue}
        />
      );
    }}
  />
);

export default ControlledSelect;
