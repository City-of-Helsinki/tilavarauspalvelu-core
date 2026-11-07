import React, { useEffect, useRef } from "react";
import { Controller, useWatch } from "react-hook-form";
import type { Control, UseFormReturn } from "react-hook-form";
import { addDays, addYears, startOfDay, subDays } from "date-fns";
import { Fieldset, Notification, RadioButton, SelectionGroup } from "hds-react";
import { capitalize } from "lodash-es";
import { useTranslation } from "next-i18next/pages";
import dynamic from "next/dynamic";
import styled from "styled-components";
import {
  ControlledDateInput,
  ControlledNumberInput,
  ControlledSelect,
  ControlledCheckbox,
} from "ui/src/components/form";
import { Sanitize } from "ui/src/components/Sanitize";
import { formatDate, parseUIDate } from "ui/src/modules/date-utils";
import { formatters as getFormatters } from "ui/src/modules/number-formatters";
import { AutoGrid, Flex, H5 } from "ui/src/styled";
import { PaymentType, PriceUnit } from "@gql/gql-types";
import { getTranslatedError } from "@/modules/helpers";
import type { ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";

const RichTextInput = dynamic(() => import("@/components/RichTextInput"), {
  ssr: false,
});

const SummaryList = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  gap: var(--spacing-s) var(--spacing-m);
  margin: 0;
  padding: var(--spacing-m);
  background: var(--color-black-5);

  dt {
    font-size: var(--fontsize-body-s);
  }

  dd {
    margin: 0;
  }
`;

const SummaryFullRow = styled.div`
  grid-column: 1 / -1;
`;

type PricingFormValues = ReservationUnitEditFormValues["pricings"][number];

export type TaxLevelOption = {
  label: string;
  pk: number;
  // The rate of the tax level today
  percentage: number;
};

export type SalesItemOption = {
  label: string;
  pk: number;
  taxLevel: number;
};

type PricingOptionsProps = {
  taxLevelOptions: TaxLevelOption[];
  salesItemOptions: SalesItemOption[];
  pricingTermsOptions: Array<{ value: string; label: string }>;
};

// The number input sets the price to null when it is empty
export function formatNetPrice(price: number | null, taxPercentage: number | undefined): string {
  if (price == null || taxPercentage == null || Number.isNaN(price)) {
    return "";
  }
  const net = (price * 100) / (100 + taxPercentage);
  return getFormatters("fi").currencyWithDecimals?.format(net) ?? "";
}

export function PricingSection({
  form,
  taxLevelOptions,
  salesItemOptions,
  pricingTermsOptions,
}: Readonly<PricingOptionsProps & { form: UseFormReturn<ReservationUnitEditFormValues> }>) {
  const { t } = useTranslation("reservationUnitEditor");
  const { control, formState } = form;
  const { errors } = formState;
  const pricings = useWatch({ control, name: "pricings" });
  const hasFuturePricing = useWatch({ control, name: "hasFuturePricing" });
  const isSharedPricingGroup = useWatch({ control, name: "isSharedPricingGroup" });
  const pricingTerms = useWatch({ control, name: "pricingTerms" });
  useCopyCurrentPricingToFuture(form);

  const hasErrors = errors.pricings != null || errors.paymentType != null || errors.pricingTerms != null;

  if (isSharedPricingGroup) {
    return (
      <EditAccordion forceOpen={hasErrors} heading={t("label.pricings")}>
        <Flex $gap="s">
          <Notification label={t("label.sharedPricingGroup")}>{t("label.sharedPricingGroupHelperText")}</Notification>
          <PaymentTypeSelect form={form} />
        </Flex>
      </EditAccordion>
    );
  }

  const currentPricing = pricings.find((p) => !p.isFuture);
  const futurePricingList = pricings.filter((p) => p.isFuture);
  // The pricing terms are of the reservation unit, so they are shown once, with the first price that has a discount
  const pricingTermsPk = pricings.find(
    (p) => !p.isReadOnly && (!p.isFuture || hasFuturePricing) && p.isPaid && p.canApplyForDiscount
  )?.pk;

  const futurePricingFields = futurePricingList.map((pricing) => (
    <PricingFields
      key={pricing.pk}
      form={form}
      pricing={pricing}
      isPricingTermsShown={pricing.pk === pricingTermsPk}
      taxLevelOptions={taxLevelOptions}
      salesItemOptions={salesItemOptions}
      pricingTermsOptions={pricingTermsOptions}
    />
  ));

  if (currentPricing?.isReadOnly) {
    const futureBegins = hasFuturePricing ? futurePricingList[0]?.begins : undefined;
    return (
      <EditAccordion forceOpen={hasErrors} heading={t("label.pricings")}>
        <Flex $gap="m">
          <section aria-labelledby="current-pricing-heading">
            <H5 as="h3" id="current-pricing-heading" $marginTop="none">
              {t("label.currentPricing")}
            </H5>
            <PricingSummary
              pricing={currentPricing}
              futureBegins={futureBegins}
              pricingTerms={pricingTerms}
              taxLevelOptions={taxLevelOptions}
              salesItemOptions={salesItemOptions}
              pricingTermsOptions={pricingTermsOptions}
            />
          </section>
          <PaymentTypeSelect form={form} />
          <ControlledCheckbox control={control} name="hasFuturePricing" label={t("label.changePricing")} />
          {hasFuturePricing && <Fieldset heading={t("label.newPricing")}>{futurePricingFields}</Fieldset>}
        </Flex>
      </EditAccordion>
    );
  }

  return (
    <EditAccordion forceOpen={hasErrors} heading={t("label.pricings")}>
      <Flex $gap="m">
        {currentPricing != null && (
          <Fieldset heading={t("label.currentPricing")}>
            <PricingFields
              form={form}
              pricing={currentPricing}
              isPaymentTypeShown
              isPricingTermsShown={currentPricing.pk === pricingTermsPk}
              taxLevelOptions={taxLevelOptions}
              salesItemOptions={salesItemOptions}
              pricingTermsOptions={pricingTermsOptions}
            />
          </Fieldset>
        )}
        <ControlledCheckbox control={control} name="hasFuturePricing" label={t("label.hasFuturePrice")} />
        {hasFuturePricing && (
          <Fieldset heading={t("label.futurePricing")} border>
            {futurePricingFields}
          </Fieldset>
        )}
      </Flex>
    </EditAccordion>
  );
}

// Internals

/// The first time the handler adds a future price, it starts as a copy of the current price.
/// The copy is made once, so the changes of the handler stay if the future price is hidden and shown again.
function useCopyCurrentPricingToFuture(form: UseFormReturn<ReservationUnitEditFormValues>): void {
  const { getValues, setValue, watch } = form;
  const hasFuturePricing = watch("hasFuturePricing");
  const isCopiedRef = useRef(getValues("pricings").some((p) => p.isFuture && p.pk > 0));

  useEffect(() => {
    if (!hasFuturePricing || isCopiedRef.current) {
      return;
    }
    isCopiedRef.current = true;
    const pricingList = getValues("pricings");
    const current = pricingList.find((p) => !p.isFuture);
    const futureIndex = pricingList.findIndex((p) => p.isFuture);
    const future = pricingList[futureIndex];
    if (current == null || future == null) {
      return;
    }
    setValue(
      `pricings.${futureIndex}`,
      {
        ...future,
        isPaid: current.isPaid,
        price: current.price,
        priceUnit: current.priceUnit,
        taxLevel: current.taxLevel,
        salesItem: current.salesItem,
        canApplyForDiscount: current.canApplyForDiscount,
        hasMaterialPrice: current.hasMaterialPrice,
        materialPriceDescriptionFi: current.materialPriceDescriptionFi,
        materialPriceDescriptionEn: current.materialPriceDescriptionEn,
        materialPriceDescriptionSv: current.materialPriceDescriptionSv,
      },
      { shouldDirty: true }
    );
  }, [hasFuturePricing, getValues, setValue]);
}

/// The payment type is of the reservation unit, not of one price, and a change to it is saved at once
function PaymentTypeSelect({ form }: Readonly<{ form: UseFormReturn<ReservationUnitEditFormValues> }>) {
  const { t } = useTranslation("reservationUnitEditor");
  const { control, formState, watch } = form;
  const isPaid = watch("pricings").some((p) => p.isPaid);

  const paymentTypeOptions = Object.values(PaymentType).map((choice) => ({
    label: t(`translation:paymentType.${choice}`),
    value: choice,
  }));

  return (
    <AutoGrid $gap="xs">
      <ControlledSelect
        control={control}
        name="paymentType"
        required={isPaid}
        options={paymentTypeOptions}
        label={t("label.paymentType")}
        tooltip={t("tooltip.paymentType")}
        error={getTranslatedError(t, formState.errors.paymentType?.message)}
      />
    </AutoGrid>
  );
}

function PricingFields({
  form,
  pricing,
  isPaymentTypeShown = false,
  isPricingTermsShown,
  taxLevelOptions,
  salesItemOptions,
  pricingTermsOptions,
}: Readonly<
  PricingOptionsProps & {
    form: UseFormReturn<ReservationUnitEditFormValues>;
    pricing: PricingFormValues;
    isPaymentTypeShown?: boolean;
    isPricingTermsShown: boolean;
  }
>) {
  const { t } = useTranslation("reservationUnitEditor");
  const { control, formState, watch, setValue } = form;
  const { errors } = formState;
  const paymentType = watch("paymentType");

  const index = watch("pricings").findIndex((p) => p.pk === pricing.pk);
  if (index === -1) {
    return null;
  }
  const pricingErrors = errors.pricings?.[index];
  const isSalesItemRequired = paymentType === PaymentType.Online || paymentType === PaymentType.OnlineOrInvoice;

  const today = startOfDay(new Date());
  // The net price changes when the rate of the tax level changes, so it is only shown with today's rate
  const taxPercentage = taxLevelOptions.find((x) => x.pk === pricing.taxLevel)?.percentage;
  const netPrice = formatNetPrice(pricing.price, taxPercentage);

  const unitPriceOptions = Object.values(PriceUnit).map((choice) => ({
    label: t(`translation:priceUnit.${choice}`),
    value: choice,
  }));

  return (
    <Flex $gap="s">
      <Controller
        name={`pricings.${index}.isPaid`}
        control={control}
        render={({ field: { value, onChange } }) => (
          <SelectionGroup
            label={t("label.pricingType")}
            direction="horizontal"
            required
            errorText={getTranslatedError(t, pricingErrors?.isPaid?.message)}
          >
            {(["free", "paid"] as const).map((type) => (
              <RadioButton
                key={type}
                id={`pricingType.${index}.${type}`}
                name={`pricingType.${index}`}
                label={t(`label.pricingTypes.${type}`)}
                value={type}
                // Nothing is checked before the handler chooses
                checked={value != null && value === (type === "paid")}
                onChange={() => onChange(type === "paid")}
              />
            ))}
          </SelectionGroup>
        )}
      />
      <AutoGrid $gap="xs">
        <ControlledDateInput
          name={`pricings.${index}.begins`}
          control={control}
          label={t("label.begins")}
          required
          // A new current price can begin in the past, a future price begins tomorrow at the earliest
          minDate={pricing.isFuture ? addDays(today, 1) : addYears(today, -10)}
          maxDate={pricing.isFuture ? undefined : today}
          helperText={t(pricing.isFuture ? "label.beginsFutureHelperText" : "label.beginsCurrentHelperText")}
          disableConfirmation
          error={getTranslatedError(t, pricingErrors?.begins?.message)}
        />
      </AutoGrid>
      {pricing.isPaid && (
        <AutoGrid $gap="xs">
          <ControlledNumberInput
            name={`pricings.${index}.price`}
            required
            control={control}
            label={t("label.price")}
            tooltipText={t("tooltip.price")}
            helperText={netPrice !== "" ? t("label.netPrice", { price: netPrice }) : undefined}
            min={0}
            errorText={getTranslatedError(t, pricingErrors?.price?.message)}
          />
          <ControlledSelect
            name={`pricings.${index}.priceUnit`}
            control={control}
            label={t("label.priceUnit")}
            required
            options={unitPriceOptions}
            tooltip={t("tooltip.priceUnit")}
            error={getTranslatedError(t, pricingErrors?.priceUnit?.message)}
          />
          <ControlledSelect
            name={`pricings.${index}.taxLevel`}
            control={control}
            required
            label={t("label.taxLevel")}
            tooltip={t("tooltip.taxLevel")}
            options={taxLevelOptions.map((x) => ({ label: x.label, value: x.pk }))}
            // The sales item must have the same tax level
            afterChange={() => setValue(`pricings.${index}.salesItem`, null)}
            error={getTranslatedError(t, pricingErrors?.taxLevel?.message)}
          />
          <ControlledSelect
            name={`pricings.${index}.salesItem`}
            control={control}
            required={isSalesItemRequired}
            clearable={!isSalesItemRequired}
            label={t("label.salesItem")}
            tooltip={t("tooltip.salesItem")}
            options={salesItemOptions
              .filter((x) => x.taxLevel === pricing.taxLevel)
              .map((x) => ({ label: x.label, value: x.pk }))}
            error={getTranslatedError(t, pricingErrors?.salesItem?.message)}
          />
        </AutoGrid>
      )}
      {isPaymentTypeShown && <PaymentTypeSelect form={form} />}
      {pricing.isPaid && (
        <ControlledCheckbox
          control={control}
          name={`pricings.${index}.canApplyForDiscount`}
          label={t("label.canApplyFreeOfCharge")}
          tooltip={t("tooltip.canApplyFreeOfCharge")}
        />
      )}
      {pricing.isPaid && pricing.canApplyForDiscount && isPricingTermsShown && (
        <AutoGrid $gap="xs">
          <ControlledSelect
            control={control}
            name="pricingTerms"
            label={t("label.pricingTerms")}
            required
            options={pricingTermsOptions}
            error={getTranslatedError(t, errors.pricingTerms?.message)}
            tooltip={t("tooltip.pricingTerms")}
            enableSearch
          />
        </AutoGrid>
      )}
      <ControlledCheckbox
        name={`pricings.${index}.hasMaterialPrice`}
        control={control}
        label={t("label.hasMaterialPrice")}
      />
      {pricing.hasMaterialPrice && (
        <Flex $gap="xs">
          <MaterialPricingDescription index={index} control={control} language="fi" />
          <MaterialPricingDescription index={index} control={control} language="sv" />
          <MaterialPricingDescription index={index} control={control} language="en" />
        </Flex>
      )}
    </Flex>
  );
}

/// The saved price in effect today, which can not change. A change is made with a new price.
/// Only the values that the price has are shown.
function PricingSummary({
  pricing,
  futureBegins,
  pricingTerms,
  taxLevelOptions,
  salesItemOptions,
  pricingTermsOptions,
}: Readonly<
  PricingOptionsProps & {
    pricing: PricingFormValues;
    /// While a new price is given, the current price ends on the day before it
    futureBegins: string | undefined;
    pricingTerms: string | null;
  }
>) {
  const { t } = useTranslation("reservationUnitEditor");
  const formatters = getFormatters("fi");

  const futureBeginsDate = futureBegins != null ? parseUIDate(futureBegins) : null;
  const validUntil = futureBeginsDate != null ? formatDate(subDays(futureBeginsDate, 1)) : null;
  const taxLevel = taxLevelOptions.find((x) => x.pk === pricing.taxLevel);
  const salesItem = salesItemOptions.find((x) => x.pk === pricing.salesItem);
  const pricingTermsLabel = pricingTermsOptions.find((x) => x.value === pricingTerms)?.label;
  const hasDiscount = pricing.isPaid && pricing.canApplyForDiscount;

  return (
    <SummaryList>
      <div>
        <dt>{t("label.pricingType")}</dt>
        <dd>{t(`label.pricingTypes.${pricing.isPaid ? "paid" : "free"}`)}</dd>
      </div>
      <div>
        <dt>{t(validUntil != null ? "label.validRange" : "label.validFrom")}</dt>
        <dd>{validUntil != null ? `${pricing.begins}–${validUntil}` : pricing.begins}</dd>
      </div>
      {pricing.isPaid && (
        <>
          <div>
            <dt>{t("label.priceWithTax")}</dt>
            <dd>{formatters.currencyWithDecimals?.format(pricing.price)}</dd>
          </div>
          {taxLevel != null && (
            <div>
              <dt>{t("label.priceWithoutTax")}</dt>
              <dd>{formatNetPrice(pricing.price, taxLevel.percentage)}</dd>
            </div>
          )}
          {pricing.priceUnit != null && (
            <div>
              <dt>{t("label.priceUnit")}</dt>
              <dd>{t(`translation:priceUnit.${pricing.priceUnit}`)}</dd>
            </div>
          )}
          {taxLevel != null && (
            <div>
              <dt>{t("label.taxLevel")}</dt>
              <dd>{taxLevel.label}</dd>
            </div>
          )}
          {salesItem != null && (
            <div>
              <dt>{t("label.salesItem")}</dt>
              <dd>{salesItem.label}</dd>
            </div>
          )}
          {hasDiscount && (
            <div>
              <dt>{t("label.discount")}</dt>
              <dd>{pricingTermsLabel ?? "-"}</dd>
            </div>
          )}
        </>
      )}
      {pricing.hasMaterialPrice && (
        <SummaryFullRow>
          <dt>{t("label.materialPrice")}</dt>
          <dd>
            <Sanitize html={pricing.materialPriceDescriptionFi} />
          </dd>
        </SummaryFullRow>
      )}
    </SummaryList>
  );
}

type DescriptionProps = {
  control: Control<ReservationUnitEditFormValues>;
  language: "fi" | "sv" | "en";
  index: number;
};

function MaterialPricingDescription({ control, language, index }: DescriptionProps) {
  const { t } = useTranslation("reservationUnitEditor");
  const label = t(`label.materialPriceDescription${capitalize(language)}`);
  return (
    <Controller
      name={`pricings.${index}.materialPriceDescription${capitalize(language)}`}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <RichTextInput
          id={label + index}
          errorText={getTranslatedError(t, error?.message)}
          value={value}
          onChange={(val) => onChange(val)}
          required
          label={label}
          helperText={t("label.materialPriceDescriptionHelperText")}
          maxLength={500}
        />
      )}
    />
  );
}
