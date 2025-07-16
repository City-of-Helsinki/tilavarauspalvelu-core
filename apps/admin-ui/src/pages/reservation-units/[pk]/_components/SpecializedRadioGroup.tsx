import React from "react";
import { Control, useController } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "./form";
import { useTranslation } from "next-i18next";
import { useMedia } from "react-use";
import { ControlledRadioGroup } from "common/src/components/form";
import { breakpoints } from "common/src/const";
import { getTranslatedError } from "@/common/util";

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

  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const groupLabel = !noLabel ? t(`reservationUnitEditor:label.${name}`) : undefined;
  const tooltip = !noTooltip ? t(`reservationUnitEditor:tooltip.${name}`) : undefined;

  const opts = options.map((opt) => {
    const prefix = `reservationUnitEditor:label.options.${name}`;
    const label = typeof opt === "string" ? `${prefix}.${opt}` : opt.label;
    const value = typeof opt === "string" ? opt : opt.value;
    return {
      value,
      label,
    };
  });

  // HDS has no auto scaling for selection group and since it's a prop and not CSS we can't use styled-components
  const correctDirection = isMobile ? "vertical" : direction;

  return (
    <ControlledRadioGroup
      name={name}
      control={control}
      label={groupLabel}
      tooltip={tooltip}
      required={required}
      direction={correctDirection}
      error={getTranslatedError(t, error?.message)}
      options={opts}
      noTranslation={noTranslation}
    />
  );
}
