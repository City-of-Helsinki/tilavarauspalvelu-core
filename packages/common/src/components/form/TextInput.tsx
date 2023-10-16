import React from "react";
import { TextInput as HDSTextInput } from "hds-react";
import {
  FieldValues,
  Path,
  useController,
  UseControllerProps,
} from "react-hook-form";
import { removeRefParam } from "../../reservation-form/util";

interface TextInputProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  id?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  clearable?: boolean;
  onEnterKeyPress: () => Promise<void>;
}

const TextInput = (props: TextInputProps<T>) => {
  const {
    name,
    id,
    control,
    required,
    disabled,
    label,
    placeholder,
    clearable,
    onEnterKeyPress,
  } = props;
  const { field, fieldState } = useController({
    control,
    name,
    rules: { required },
  });
  const inputProps = {
    id,
    name,
    required,
    disabled,
    clearable,
    label,
    placeholder,
  };
  return (
    <HDSTextInput
      {...removeRefParam(field)}
      {...inputProps}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onEnterKeyPress.call();
        }
      }}
      onChange={field.onChange}
      onBlur={field.onBlur}
      value={field.value}
      errorText={fieldState.error && fieldState.error.message}
      aria-placeholder={inputProps.placeholder}
      aria-roledescription={inputProps.label}
    />
  );
};

export default TextInput;
