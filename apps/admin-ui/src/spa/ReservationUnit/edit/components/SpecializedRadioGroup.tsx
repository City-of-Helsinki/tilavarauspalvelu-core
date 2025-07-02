import { Control, useController } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { useTranslation } from "next-i18next";
import { ControlledRadioGroup } from "common/src/components/form";
import { getTranslatedError } from "@/common/util";
import React from "react";

export function SpecializedRadioGroup({
  name,
  options,
  control,
  direction,
  required,
  noLabel,
  noTooltip,
  noTranslation,
}: {
  name: "reservationKind" | "bufferType" | "cancellationRule";
  options: readonly string[] | readonly { label: string; value: number }[];
  control: Control<ReservationUnitEditFormValues>;
  direction?: "horizontal" | "vertical";
  required?: boolean;
  noLabel?: boolean;
  noTooltip?: boolean;
  noTranslation?: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const { fieldState } = useController({ name, control });
  const { error } = fieldState;

  const groupLabel = !noLabel ? t(`ReservationUnitEditor.label.${name}`) : undefined;
  const tooltip = !noTooltip ? t(`ReservationUnitEditor.tooltip.${name}`) : undefined;
  const opts = options.map((opt) => {
    const prefix = `ReservationUnitEditor.label.options.${name}`;
    const label = typeof opt === "string" ? `${prefix}.${opt}` : opt.label;
    const value = typeof opt === "string" ? opt : opt.value;
    return {
      value,
      label,
    };
  });

  return (
    <ControlledRadioGroup
      name={name}
      control={control}
      label={groupLabel}
      tooltip={tooltip}
      required={required}
      direction={direction}
      error={getTranslatedError(t, error?.message)}
      options={opts}
      noTranslation={noTranslation}
    />
  );
}
