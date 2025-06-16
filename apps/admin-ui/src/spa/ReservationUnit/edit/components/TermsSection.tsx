import { UseFormReturn } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { ControlledSelect } from "common/src/components/form";
import React from "react";
import { type ReservationUnitEditFormValues } from "../form";
import { ControlledRichTextInput } from "./ControlledRichTextInput";
import { AutoGrid } from "common/styled";

type OptionType = { value: string; label: string };

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

  const hasErrors = errors.termsOfUseFi != null || errors.termsOfUseEn != null || errors.termsOfUseSv != null;

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
        {(["serviceSpecificTerms", "paymentTerms", "cancellationTerms"] as const).map((name) => {
          const opts = termsOptions.find((o) => o.key === name)?.options ?? [];
          return (
            <ControlledSelect
              control={control}
              name={name}
              key={name}
              clearable
              label={t(`ReservationUnitEditor.label.${name}`)}
              placeholder={t(`ReservationUnitEditor.termsPlaceholder`)}
              options={opts}
              tooltip={t(`ReservationUnitEditor.tooltip.${name}`)}
            />
          );
        })}
      </AutoGrid>
      {(["termsOfUseFi", "termsOfUseEn", "termsOfUseSv"] as const).map((n) => (
        <ControlledRichTextInput control={control} fieldName={n} key={n} />
      ))}
    </EditAccordion>
  );
}
