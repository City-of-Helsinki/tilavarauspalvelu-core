import React from "react";
import type { HTMLAttributes } from "react";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";
import { useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import { getTranslatedError } from "@/modules/helpers";
import type { ReservationUnitEditFormValues } from "./form";
import { getTranslatedTooltipTex } from "./utils";

const RichTextInput = dynamic(() => import("@/components/RichTextInput"), {
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
  maxLength?: number;
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
      label={t(`reservationUnitEditor:label.${fieldName}`)}
      errorText={getTranslatedError(t, fieldState.error?.message)}
      tooltipText={getTranslatedTooltipTex(t, fieldName)}
    />
  );
}
