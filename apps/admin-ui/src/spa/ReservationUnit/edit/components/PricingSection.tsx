import { Controller, UseFormReturn } from "react-hook-form";
import { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { EditAccordion } from "@/spa/ReservationUnit/edit/components/styled";
import { AutoGrid } from "common/styled";
import {
  ControlledDateInput,
  ControlledNumberInput,
  ControlledSelect,
  ControlledCheckbox,
} from "common/src/components/form";
import { getTranslatedError } from "@/common/util";
import React from "react";
import { FieldGroup } from "@/spa/ReservationUnit/edit/components/FieldGroup";
import styled from "styled-components";
import { PaymentType, PriceUnit } from "@gql/gql-types";
import { addDays } from "date-fns";
import { IconAlertCircleFill, RadioButton } from "hds-react";
import { useTranslation } from "react-i18next";
import { startOfDay } from "date-fns/startOfDay";

const Error = styled.div`
  margin-top: var(--spacing-3-xs);
  color: var(--color-error);
  display: flex;
  gap: var(--spacing-2-xs);

  svg {
    flex-shrink: 0;
  }

  white-space: nowrap;
`;

type Props = {
  pk: number;
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxPercentageOptions: TaxOption[];
};

function removeTax(price: number, taxPercentage: number) {
  const tmp = (price * 100) / (100 + taxPercentage);
  return Math.floor(tmp * 100) / 100;
}

function addTax(price: number, taxPercentage: number) {
  const tmp = price * ((100 + taxPercentage) / 100);
  return Math.floor(tmp * 100) / 100;
}

export type TaxOption = {
  label: string;
  pk: number;
  value: number;
};

function PaidPricingPart({
  form,
  index,
  taxPercentageOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  index: number;
  taxPercentageOptions: TaxOption[];
}) {
  const { t } = useTranslation();
  const { control, setValue, formState, watch } = form;
  const { errors } = formState;

  const unitPriceOptions = Object.values(PriceUnit).map((choice) => ({
    label: t(`priceUnit.${choice}`),
    value: choice,
  }));

  const paymentTypeOptions = Object.values(PaymentType).map((choice) => ({
    label: t(`paymentType.${choice}`),
    value: choice,
  }));

  const pricing = watch(`pricings.${index}`);
  const taxPercentagePk = watch(`pricings.${index}.taxPercentage`);
  const taxPercentage = taxPercentageOptions.find((x) => x.pk === taxPercentagePk)?.value ?? 0;

  // TODO mobile number keyboard?
  return (
    <>
      <ControlledSelect
        name={`pricings.${index}.priceUnit`}
        control={control}
        label={t("ReservationUnitEditor.label.priceUnit")}
        style={{ gridColumnStart: "1" }}
        required
        options={unitPriceOptions}
        tooltip={t("ReservationUnitEditor.tooltip.priceUnit")}
        error={getTranslatedError(t, errors.pricings?.[index]?.priceUnit?.message)}
      />
      <ControlledSelect
        name={`pricings.${index}.taxPercentage`}
        control={control}
        required
        label={t(`ReservationUnitEditor.label.taxPercentage`)}
        options={taxPercentageOptions.map((x) => ({
          label: x.label,
          value: x.pk,
        }))}
        afterChange={(val) => {
          const low = pricing.lowestPrice;
          const high = pricing.highestPrice;
          const tax = taxPercentageOptions.find((x) => x.pk === val)?.value ?? 0;
          if (!Number.isNaN(low)) {
            const lowNet = removeTax(low, tax);
            setValue(`pricings.${index}.lowestPriceNet`, lowNet);
          }
          if (!Number.isNaN(high)) {
            const highNet = removeTax(high, tax);
            setValue(`pricings.${index}.highestPriceNet`, highNet);
          }
        }}
        error={getTranslatedError(t, errors.pricings?.[index]?.taxPercentage?.message)}
      />
      <ControlledNumberInput
        name={`pricings.${index}.lowestPriceNet`}
        required
        control={control}
        afterChange={(value) => {
          if (value != null) {
            setValue(`pricings.${index}.lowestPrice`, addTax(value, taxPercentage));
          }
        }}
        label={t("ReservationUnitEditor.label.lowestPriceNet")}
        min={0}
        errorText={getTranslatedError(t, errors.pricings?.[index]?.lowestPriceNet?.message)}
      />
      <ControlledNumberInput
        required
        name={`pricings.${index}.lowestPrice`}
        control={control}
        afterChange={(value) => {
          if (value != null) {
            setValue(`pricings.${index}.lowestPriceNet`, removeTax(value, taxPercentage));
          }
        }}
        label={t("ReservationUnitEditor.label.lowestPrice")}
        tooltipText={t("ReservationUnitEditor.tooltip.lowestPrice")}
        min={0}
        errorText={getTranslatedError(t, errors.pricings?.[index]?.lowestPrice?.message)}
      />
      <ControlledNumberInput
        name={`pricings.${index}.highestPriceNet`}
        required
        control={control}
        afterChange={(value) => {
          if (value != null) {
            setValue(`pricings.${index}.highestPrice`, addTax(value, taxPercentage));
          }
        }}
        label={t("ReservationUnitEditor.label.highestPriceNet")}
        min={0}
        errorText={getTranslatedError(t, errors.pricings?.[index]?.highestPriceNet?.message)}
      />
      <ControlledNumberInput
        name={`pricings.${index}.highestPrice`}
        required
        control={control}
        afterChange={(value) => {
          if (value != null) {
            setValue(`pricings.${index}.highestPriceNet`, removeTax(value, taxPercentage));
          }
        }}
        label={t("ReservationUnitEditor.label.highestPrice")}
        tooltipText={t("ReservationUnitEditor.tooltip.highestPrice")}
        min={0}
        errorText={getTranslatedError(t, errors.pricings?.[index]?.highestPrice?.message)}
      />
      <ControlledSelect
        // This is not pricing type specific
        name={`pricings.${index}.paymentType`}
        control={control}
        required
        options={paymentTypeOptions}
        label={t("ReservationUnitEditor.label.paymentTypes")}
        tooltip={t("ReservationUnitEditor.tooltip.paymentTypes")}
        error={getTranslatedError(t, errors.pricings?.[index]?.paymentType?.message)}
      />
    </>
  );
}

export function PricingTypeView({ pk, form, taxPercentageOptions }: Props): JSX.Element | null {
  const { t } = useTranslation();

  const { control, formState, watch } = form;
  const { errors } = formState;

  const index = watch("pricings").findIndex((pricing) => pricing.pk === pk);
  // TODO better error handling for index === -1
  if (index === -1) {
    return null;
  }

  const isPaid = watch(`pricings.${index}.isPaid`);
  const isFuture = watch(`pricings.${index}.isFuture`);
  const priceOptions = ["free", "paid"];

  return (
    <AutoGrid $alignCenter $gap="xs">
      {isFuture && (
        <ControlledDateInput
          name={`pricings.${index}.begins`}
          control={control}
          label={t("ReservationUnitEditor.label.begins")}
          minDate={startOfDay(addDays(new Date(), 1))}
          disableConfirmation
          error={getTranslatedError(t, errors.pricings?.[index]?.begins?.message)}
        />
      )}
      <Controller
        name={`pricings.${index}.isPaid`}
        control={control}
        render={({ field: { value, onChange } }) => (
          <>
            {priceOptions.map((type) => (
              <RadioButton
                key={`pricings.${index}.pricingType.${type}`}
                id={`pricingType.${index}.${type}`}
                name={`pricingType.${index}`}
                label={t(`ReservationUnitEditor.label.pricingTypes.${type}`)}
                value={type}
                checked={type === (value ? "paid" : "free")}
                onChange={(val) => {
                  if (val.target.value === "paid") {
                    onChange(true);
                  } else {
                    onChange(false);
                  }
                }}
              />
            ))}
          </>
        )}
      />
      {errors.pricings?.message != null && (
        <Error>
          <IconAlertCircleFill />
          <span>{getTranslatedError(t, errors.pricings.message)}</span>
        </Error>
      )}
      {isPaid && <PaidPricingPart form={form} index={index} taxPercentageOptions={taxPercentageOptions} />}
    </AutoGrid>
  );
}

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
      <PricingTypeView pk={pricing.pk} form={form} taxPercentageOptions={taxPercentageOptions} />
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
  const hasErrors = errors.pricings != null;

  return (
    <EditAccordion open={hasErrors} heading={t("ReservationUnitEditor.label.pricings")}>
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
