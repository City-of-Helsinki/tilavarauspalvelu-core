import React from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { ControlledSelect } from "ui/src/components/form";
import { AutoGrid } from "ui/src/styled";
import { ControlledRichTextInput } from "./ControlledRichTextInput";
import type { ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";

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
    <EditAccordion open={hasErrors} heading={t("reservationUnitEditor:termsInstructions")}>
      <AutoGrid $minWidth="20rem">
        {(["serviceSpecificTerms", "paymentTerms", "cancellationTerms"] as const).map((name) => (
          <ControlledSelect
            control={control}
            name={name}
            key={name}
            clearable
            options={termsOptions.find((o) => o.key === name)?.options ?? []}
            label={t(`reservationUnitEditor:label.${name}`)}
            placeholder={t(`reservationUnitEditor:termsPlaceholder`)}
            tooltip={t(`reservationUnitEditor:tooltip.${name}`)}
            enableSearch
          />
        ))}
        {(["notesWhenApplyingFi", "notesWhenApplyingEn", "notesWhenApplyingSv"] as const).map((n) => (
          <StyledRichTextInput control={control} fieldName={n} key={n} />
        ))}
      </AutoGrid>
    </EditAccordion>
  );
}
