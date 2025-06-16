import { UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { useTranslation } from "next-i18next";
import { getTranslatedError } from "@/common/util";
import { ControlledNumberInput } from "common/src/components/form";
import React from "react";

export function CustomNumberInput({
  name,
  form,
  max,
  min,
  required,
}: {
  name: "maxPersons" | "minPersons" | "surfaceArea" | "reservationsMinDaysBefore" | "maxReservationsPerUser";
  form: UseFormReturn<ReservationUnitEditFormValues>;
  max?: number;
  min?: number;
  required?: boolean;
}) {
  const { t } = useTranslation();

  const { formState, control } = form;
  const { errors } = formState;

  const errMsg = errors[name]?.message;
  const tErrMsg = getTranslatedError(t, errMsg);

  const label = t(`ReservationUnitEditor.label.${name}`);
  const tooltipText = t(`ReservationUnitEditor.tooltip.${name}`);
  const helperText = t(`ReservationUnitEditor.${name}HelperText`);

  return (
    <ControlledNumberInput
      control={control}
      name={name}
      min={min}
      max={max}
      required={required}
      label={label}
      tooltipText={tooltipText}
      helperText={helperText}
      errorText={tErrMsg}
    />
  );
}
