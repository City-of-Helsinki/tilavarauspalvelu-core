import React from "react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";
import { ControlledSelect } from "ui/src/components/form";
import { AutoGrid } from "ui/src/styled";
import { getTranslatedError } from "@/modules/helpers";
import { ControlledRichTextInput } from "./ControlledRichTextInput";
import { isShownPaidPricing } from "./form";
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
  const pricingList = useWatch({ control, name: "pricings" });
  const hasFuturePricing = useWatch({ control, name: "hasFuturePricing" });
  const isSharedPricingGroup = useWatch({ control, name: "isSharedPricingGroup" });
  // The prices of a shared pricing group are not edited here, so they do not make the payment terms required
  const isPaymentTermsRequired =
    !isSharedPricingGroup && pricingList.some((p) => isShownPaidPricing(p, hasFuturePricing));

  const hasErrors =
    errors.paymentTerms != null ||
    errors.notesWhenApplyingFi != null ||
    errors.notesWhenApplyingEn != null ||
    errors.notesWhenApplyingSv != null;

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
    <EditAccordion forceOpen={hasErrors} heading={t("reservationUnitEditor:termsInstructions")}>
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
            required={name === "paymentTerms" && isPaymentTermsRequired}
            error={getTranslatedError(t, errors[name]?.message)}
          />
        ))}
        {(["notesWhenApplyingFi", "notesWhenApplyingEn", "notesWhenApplyingSv"] as const).map((n) => (
          <StyledRichTextInput control={control} fieldName={n} key={n} maxLength={2000} />
        ))}
      </AutoGrid>
    </EditAccordion>
  );
}
