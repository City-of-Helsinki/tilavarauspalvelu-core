import { Control, useController } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { useTranslation } from "next-i18next";
import { getTranslatedError } from "@/common/util";
import React from "react";
import dynamic from "next/dynamic";
import { getTranslatedTooltipTex } from "@/spa/ReservationUnit/edit/utils";

const RichTextInput = dynamic(() => import("../../../../component/RichTextInput"), {
  ssr: false,
});

export function ControlledRichTextInput({
  control,
  fieldName,
}: {
  control: Control<ReservationUnitEditFormValues>;
  fieldName:
    | "reservationCancelledInstructionsFi"
    | "reservationCancelledInstructionsEn"
    | "reservationCancelledInstructionsSv"
    | "reservationConfirmedInstructionsFi"
    | "reservationConfirmedInstructionsEn"
    | "reservationConfirmedInstructionsSv"
    | "reservationPendingInstructionsFi"
    | "reservationPendingInstructionsEn"
    | "reservationPendingInstructionsSv"
    | "termsOfUseFi"
    | "termsOfUseEn"
    | "termsOfUseSv";
}) {
  const { t } = useTranslation();
  const { field, fieldState } = useController({
    control,
    name: fieldName,
  });

  return (
    <RichTextInput
      {...field}
      id={fieldName}
      label={t(`ReservationUnitEditor.label.${fieldName}`)}
      errorText={getTranslatedError(t, fieldState.error?.message)}
      tooltipText={getTranslatedTooltipTex(t, fieldName)}
    />
  );
}
