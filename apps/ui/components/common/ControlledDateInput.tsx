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
  id?: string;
  label?: string;
  maxDate?: Date;
  minDate?: Date;
  initialMonth?: Date;
  disableConfirmation?: boolean;
}

// NOTE string version because Date breaks keyboard input
const ControlledDateInput = <T extends FieldValues>({
  control,
  name,
  error,
  required,
  disabled,
  id,
  label,
  maxDate,
  minDate,
  initialMonth,
  disableConfirmation,
}: ControllerProps<T>) => {
  const {
    field: { value, onChange },
  } = useController({ control, name, rules: { required } });
  const { t } = useTranslation();

  return (
    <DateInput
      id={id ?? `reservationDialog.${name}`}
      label={label ?? t(`ReservationDialog.${name}`)}
      minDate={minDate ?? new Date()}
      maxDate={maxDate ?? addYears(new Date(), 2)}
      initialMonth={initialMonth}
      disableConfirmation={disableConfirmation ?? true}
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
