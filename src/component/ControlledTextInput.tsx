import React from 'react';
import { TextInput } from 'hds-react';
import { Controller, useForm } from 'react-hook-form';

type Props = {
  name: string;
  label: string;
  control: ReturnType<typeof useForm>['control'];
  required: boolean;
  toEntity: (v: string) => string;
  fromEntity: (v: string) => string;
};
const ControlledTextInput = ({
  name,
  label,
  control,
  required,
  toEntity,
  fromEntity,
}: Props): JSX.Element => (
  <Controller
    control={control}
    name={name}
    render={(props) => {
      const { value: entityValue, ...rest } = props;
      const editorValue = fromEntity(entityValue);

      return (
        <TextInput
          {...rest}
          onChange={(e) => props.onChange(toEntity(e.target.value))}
          label={label}
          id={name}
          required={required}
          value={editorValue}
        />
      );
    }}
  />
);

export default ControlledTextInput;
