import { UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import {
  PricingTypeView,
  TaxOption,
} from "@/spa/ReservationUnit/edit/components/PricingTypeView";
import { useTranslation } from "next-i18next";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { AutoGrid } from "common/styled";
import { ControlledCheckbox } from "common/src/components/form/ControlledCheckbox";
import { ControlledSelect } from "common/src/components/form";
import { getTranslatedError } from "@/common/util";
import React from "react";
import { FieldGroup } from "@/spa/ReservationUnit/edit/components/FieldGroup";

function PricingControl({
  pricing,
  form,
  taxPercentageOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  pricing: ReservationUnitEditFormValues["pricings"][0];
  taxPercentageOptions: TaxOption[];
}) {
  const { t } = useTranslation();
  return (
    <FieldGroup
      key={`pricing-${pricing.pk}`}
      heading={t("ReservationUnitEditor.label.pricingType")}
      required
      tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
      style={{ gridColumn: "1 / -1" }}
    >
      <PricingTypeView
        pk={pricing.pk}
        form={form}
        taxPercentageOptions={taxPercentageOptions}
      />
    </FieldGroup>
  );
}

export function PricingSection({
  form,
  taxPercentageOptions,
  pricingTermsOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxPercentageOptions: TaxOption[];
  pricingTermsOptions: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const { control, watch, formState } = form;
  const { errors } = formState;

  const pricings = watch("pricings");
  const isPaid = pricings.filter((p) => p.isPaid).length > 0;
  const hasErrors = errors.pricings != null || errors.paymentTypes != null;

  return (
    <EditAccordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.label.pricings")}
    >
      <AutoGrid>
        {watch("pricings")
          .filter((p) => !p.isFuture)
          .map((pricing) => (
            <PricingControl
              key={pricing.pk}
              form={form}
              pricing={pricing}
              taxPercentageOptions={taxPercentageOptions}
            />
          ))}
        <ControlledCheckbox
          control={control}
          name="hasFuturePricing"
          label={t("ReservationUnitEditor.label.hasFuturePrice")}
          style={{ gridColumn: "1 / -1" }}
        />
        {watch("hasFuturePricing") &&
          watch("pricings")
            .filter((p) => p.isFuture)
            .map((pricing) => (
              <PricingControl
                key={pricing.pk}
                form={form}
                pricing={pricing}
                taxPercentageOptions={taxPercentageOptions}
              />
            ))}
        {isPaid && (
          <ControlledCheckbox
            control={control}
            name="canApplyFreeOfCharge"
            label={t("ReservationUnitEditor.label.canApplyFreeOfCharge")}
            tooltip={t("ReservationUnitEditor.tooltip.canApplyFreeOfCharge")}
          />
        )}
        {watch("canApplyFreeOfCharge") && isPaid && (
          <ControlledSelect
            control={control}
            name="pricingTerms"
            label={t("ReservationUnitEditor.label.pricingTerms")}
            required
            clearable
            options={pricingTermsOptions}
            error={getTranslatedError(t, errors.pricingTerms?.message)}
            tooltip={t("ReservationUnitEditor.tooltip.pricingTerms")}
          />
        )}
      </AutoGrid>
    </EditAccordion>
  );
}
