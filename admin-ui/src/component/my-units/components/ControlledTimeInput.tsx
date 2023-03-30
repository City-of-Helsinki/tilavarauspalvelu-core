import React from "react";
import {
  useController,
  UseControllerProps,
  FieldValues,
} from "react-hook-form";
import { TimeInput } from "hds-react";
import { useTranslation } from "react-i18next";

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const ControlledTimeInput = <T extends FieldValues>({
  name,
  control,
  error,
  required,
  disabled,
}: ControllerProps<T>) => {
  const { t } = useTranslation();
  const { field } = useController({ control, name, rules: { required } });

  return (
    <TimeInput
      id={`ReservationDialog.${field.name}`}
      label={t(`ReservationDialog.${field.name}`)}
      hoursLabel={t("common.hoursLabel")}
      minutesLabel={t("common.minutesLabel")}
      required={required}
      disabled={disabled}
      errorText={error}
      onChange={field.onChange}
      value={field.value}
    />
  );
};

export default ControlledTimeInput;
