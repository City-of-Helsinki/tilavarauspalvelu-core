import React from "react";
import {
  useController,
  UseControllerProps,
  FieldValues,
} from "react-hook-form";
import { DateInput } from "hds-react";
import { useTranslation } from "react-i18next";
import { addYears, format } from "date-fns";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const ControlledDateInput = <T extends FieldValues>({
  control,
  name,
  error,
  required,
  disabled,
}: ControllerProps<T>) => {
  const {
    field: { value, onChange },
    fieldState: { isDirty },
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
      errorText={error}
      disabled={disabled}
      // invalid={errors.date != null}
      // hack to deal with defaultValue without breaking keyboard input
      value={!isDirty && value ? format(value, "dd.MM.yyyy") : undefined}
      required
      onChange={(_, date) => onChange(date)}
    />
  );
};

export default ControlledDateInput;
