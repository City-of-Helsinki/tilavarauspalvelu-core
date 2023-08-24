import React from "react";
import { addYears } from "date-fns";
import { DateInput } from "hds-react";
import {
  type FieldValues,
  type UseControllerProps,
  useController,
} from "react-hook-form";
import { useTranslation } from "react-i18next";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// NOTE string version because Date breaks keyboard input
const ControlledDateInput = <T extends FieldValues>({
  control,
  name,
  error,
  required,
  disabled,
}: ControllerProps<T>) => {
  const {
    field: { value, onChange },
  } = useController({ control, name, rules: { required } });
  const { t } = useTranslation();

  return (
    <DateInput
      id={`reservationDialog.${name}`}
      label={t(`ReservationDialog.${name}`)}
      minDate={new Date()}
      maxDate={addYears(new Date(), 3)}
      disableConfirmation
      language="fi"
      value={value}
      errorText={error}
      onChange={(text) => onChange(text)}
      required={required}
      disabled={disabled}
    />
  );
};

export default ControlledDateInput;
