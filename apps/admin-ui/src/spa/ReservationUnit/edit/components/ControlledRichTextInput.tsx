import React, { type HTMLAttributes } from "react";
import { Control, useController } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { useTranslation } from "next-i18next";
import { getTranslatedError } from "@/common/util";
import dynamic from "next/dynamic";
import { getTranslatedTooltipTex } from "@/spa/ReservationUnit/edit/utils";

const RichTextInput = dynamic(() => import("../../../../component/RichTextInput"), {
  ssr: false,
});

type FieldName =
  | "reservationCancelledInstructionsFi"
  | "reservationCancelledInstructionsEn"
  | "reservationCancelledInstructionsSv"
  | "reservationConfirmedInstructionsFi"
  | "reservationConfirmedInstructionsEn"
  | "reservationConfirmedInstructionsSv"
  | "reservationPendingInstructionsFi"
  | "reservationPendingInstructionsEn"
  | "reservationPendingInstructionsSv"
  | "notesWhenApplyingFi"
  | "notesWhenApplyingEn"
  | "notesWhenApplyingSv";

interface ControlledRichTextInputProps extends HTMLAttributes<HTMLDivElement> {
  control: Control<ReservationUnitEditFormValues>;
  fieldName: FieldName;
}

export function ControlledRichTextInput({
  control,
  fieldName,
  ...rest
}: ControlledRichTextInputProps): React.ReactElement {
  const { t } = useTranslation();
  const { field, fieldState } = useController({
    control,
    name: fieldName,
  });

  return (
    <RichTextInput
      {...rest}
      {...field}
      id={fieldName}
      label={t(`ReservationUnitEditor.label.${fieldName}`)}
      errorText={getTranslatedError(t, fieldState.error?.message)}
      tooltipText={getTranslatedTooltipTex(t, fieldName)}
    />
  );
}
