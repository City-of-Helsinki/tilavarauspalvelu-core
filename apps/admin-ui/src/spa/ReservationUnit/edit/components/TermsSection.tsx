import React from "react";
import styled from "styled-components";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { ControlledSelect } from "common/src/components/form";
import { type ReservationUnitEditFormValues } from "../form";
import { ControlledRichTextInput } from "./ControlledRichTextInput";
import { AutoGrid } from "common/styled";

type OptionType = { value: string; label: string };

const StyledRichTextInput = styled(ControlledRichTextInput)`
  grid-column: 1 / -1;
`;

export function TermsSection({
  form,
  options,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  options: {
    service: OptionType[];
    payment: OptionType[];
    cancellation: OptionType[];
  };
}) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const hasErrors =
    errors.notesWhenApplyingFi != null || errors.notesWhenApplyingEn != null || errors.notesWhenApplyingSv != null;

  const termsOptions = [
    {
      key: "serviceSpecificTerms",
      options: options.service,
    },
    {
      key: "paymentTerms",
      options: options.payment,
    },
    {
      key: "cancellationTerms",
      options: options.cancellation,
    },
  ] as const;

  return (
    <EditAccordion open={hasErrors} heading={t("ReservationUnitEditor.termsInstructions")}>
      <AutoGrid $minWidth="20rem">
        {(["serviceSpecificTerms", "paymentTerms", "cancellationTerms"] as const).map((name) => (
          <ControlledSelect
            control={control}
            name={name}
            key={name}
            clearable
            label={t(`ReservationUnitEditor.label.${name}`)}
            placeholder={t(`ReservationUnitEditor.termsPlaceholder`)}
            options={termsOptions.find((o) => o.key === name)?.options ?? []}
            tooltip={t(`ReservationUnitEditor.tooltip.${name}`)}
          />
        ))}
        {(["notesWhenApplyingFi", "notesWhenApplyingEn", "notesWhenApplyingSv"] as const).map((n) => (
          <StyledRichTextInput control={control} fieldName={n} key={n} />
        ))}
      </AutoGrid>
    </EditAccordion>
  );
}
