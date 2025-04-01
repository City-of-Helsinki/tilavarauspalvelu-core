import { UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import {
  PricingTypeView,
  TaxOption,
} from "@/spa/ReservationUnit/edit/components/PricingTypeView";
import { useTranslation } from "next-i18next";
import { FieldGroup } from "@/spa/ReservationUnit/edit/components/FieldGroup";
import React from "react";

export function PricingControl({
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
