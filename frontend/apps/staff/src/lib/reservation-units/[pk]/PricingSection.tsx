import React from "react";
import { Controller, useWatch } from "react-hook-form";
import type { Control, UseFormReturn } from "react-hook-form";
import { addDays, startOfDay } from "date-fns";
import { IconAlertCircleFill, RadioButton } from "hds-react";
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
import { formatters as getFormatters } from "ui/src/modules/number-formatters";
import { AutoGrid, Flex, FullRow, HR } from "ui/src/styled";
import { PaymentType, PriceUnit } from "@gql/gql-types";
import { getTranslatedError } from "@/modules/helpers";
import { FieldGroup } from "./FieldGroup";
import type { ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";

const RichTextInput = dynamic(() => import("@/components/RichTextInput"), {
  ssr: false,
});

const FuturePricingContainer = styled(Flex)<{ $toggled: boolean }>`
  padding-block: var(--spacing-s);
  ${({ $toggled }) => $toggled && "background: var(--color-black-5);"}
`;

const ErrorText = styled.div`
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
  taxLevelOptions: TaxLevelOption[];
};

export type TaxLevelOption = {
  label: string;
  pk: number;
  // The rate of the tax level today
  percentage: number;
};

// The number input sets the price to null when it is empty
export function formatNetPrice(price: number | null, taxPercentage: number | undefined): string {
  if (price == null || taxPercentage == null || Number.isNaN(price)) {
    return "";
  }
  const net = (price * 100) / (100 + taxPercentage);
  return getFormatters("fi").currencyWithDecimals?.format(net) ?? "";
}

function PaidPricingPart({
  form,
  index,
  taxLevelOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  index: number;
  taxLevelOptions: TaxLevelOption[];
}) {
  const { t } = useTranslation("reservationUnitEditor");
  const { control, formState, watch } = form;
  const { errors } = formState;

  const unitPriceOptions = Object.values(PriceUnit).map((choice) => ({
    label: t(`translation:priceUnit.${choice}`),
    value: choice,
  }));

  const paymentTypeOptions = Object.values(PaymentType).map((choice) => ({
    label: t(`translation:paymentType.${choice}`),
    value: choice,
  }));

  const pricing = watch(`pricings.${index}`);
  // The net price changes when the rate of the tax level changes, so it is only shown with today's rate
  const taxPercentage = taxLevelOptions.find((x) => x.pk === pricing.taxLevel)?.percentage;

  const netPriceHelperText = (price: number | null) => {
    const net = formatNetPrice(price, taxPercentage);
    return net !== "" ? t("label.netPrice", { price: net }) : undefined;
  };

  return (
    <FullRow>
      <AutoGrid $gap="xs">
        <ControlledSelect
          name={`pricings.${index}.priceUnit`}
          control={control}
          label={t("label.priceUnit")}
          required
          options={unitPriceOptions}
          tooltip={t("tooltip.priceUnit")}
          error={getTranslatedError(t, errors.pricings?.[index]?.priceUnit?.message)}
        />
        <ControlledSelect
          name={`pricings.${index}.taxLevel`}
          control={control}
          required
          label={t("label.taxLevel")}
          tooltip={t("tooltip.taxLevel")}
          options={taxLevelOptions.map((x) => ({
            label: x.label,
            value: x.pk,
          }))}
          error={getTranslatedError(t, errors.pricings?.[index]?.taxLevel?.message)}
        />
        <ControlledSelect
          // This is not pricing type specific
          name={`pricings.${index}.paymentType`}
          control={control}
          required
          options={paymentTypeOptions}
          label={t("label.paymentType")}
          tooltip={t("tooltip.paymentType")}
          error={getTranslatedError(t, errors.pricings?.[index]?.paymentType?.message)}
        />
        <ControlledNumberInput
          required
          name={`pricings.${index}.lowestPrice`}
          control={control}
          label={t("label.lowestPrice")}
          tooltipText={t("tooltip.lowestPrice")}
          helperText={netPriceHelperText(pricing.lowestPrice)}
          min={0}
          style={{ gridColumnStart: "1" }}
          errorText={getTranslatedError(t, errors.pricings?.[index]?.lowestPrice?.message)}
        />
        <ControlledNumberInput
          name={`pricings.${index}.highestPrice`}
          required
          control={control}
          label={t("label.highestPrice")}
          tooltipText={t("tooltip.highestPrice")}
          helperText={netPriceHelperText(pricing.highestPrice)}
          min={0}
          errorText={getTranslatedError(t, errors.pricings?.[index]?.highestPrice?.message)}
        />
      </AutoGrid>
    </FullRow>
  );
}

export function PricingTypeView({ pk, form, taxLevelOptions }: Props): React.ReactElement | null {
  const { t } = useTranslation();

  const { control, formState, watch } = form;
  const { errors } = formState;

  const index = watch("pricings").findIndex((pricing) => pricing.pk === pk);
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
          label={t("reservationUnitEditor:label.begins")}
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
                label={t(`reservationUnitEditor:label.pricingTypes.${type}`)}
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
        <ErrorText>
          <IconAlertCircleFill />
          <span>{getTranslatedError(t, errors.pricings.message)}</span>
        </ErrorText>
      )}
      {isPaid && <PaidPricingPart form={form} index={index} taxLevelOptions={taxLevelOptions} />}
    </AutoGrid>
  );
}

function PricingControl({
  pricing,
  form,
  taxLevelOptions,
}: {
  pricing: ReservationUnitEditFormValues["pricings"][0];
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxLevelOptions: TaxLevelOption[];
}) {
  const { t } = useTranslation("reservationUnitEditor");
  const { watch, control } = form;
  const index = watch("pricings").findIndex((p) => p.pk === pricing.pk);
  const toggleFieldName = `pricings.${index}.hasMaterialPrice` as const;
  const showMaterialDescriptions = watch(toggleFieldName);
  return (
    <Flex>
      <FieldGroup
        key={`pricing-${pricing.pk}`}
        heading={pricing.isFuture ? `Maksullisuus ${pricing.begins} alkaen` : t("label.pricingType")}
        required
        tooltip={t("tooltip.pricingType")}
      >
        <PricingTypeView pk={pricing.pk} form={form} taxLevelOptions={taxLevelOptions} />
      </FieldGroup>
      <ControlledCheckbox name={toggleFieldName} control={control} label={t("label.hasMaterialPrice")} />
      {showMaterialDescriptions && (
        <Flex $gap="xs" key={pricing.pk}>
          <MaterialPricingDescription
            index={index}
            control={control}
            language="fi"
            helperText={t("label.materialPriceDescriptionHelperText")}
          />
          <MaterialPricingDescription index={index} control={control} language="sv" />
          <MaterialPricingDescription index={index} control={control} language="en" />
        </Flex>
      )}
    </Flex>
  );
}

type DescriptionProps = {
  control: Control<ReservationUnitEditFormValues>;
  language: "fi" | "sv" | "en";
  index: number;
  helperText?: string;
};

function MaterialPricingDescription({ control, language, index, helperText }: DescriptionProps) {
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
          helperText={helperText}
          maxLength={500}
        />
      )}
    />
  );
}

export function PricingSection({
  form,
  taxLevelOptions,
  pricingTermsOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxLevelOptions: TaxLevelOption[];
  pricingTermsOptions: Array<{ value: string; label: string }>;
}) {
  const { t } = useTranslation("reservationUnitEditor");
  const { control, formState } = form;
  const { errors } = formState;
  const pricings = useWatch({ control, name: "pricings" });
  const hasFuturePricing = useWatch({ control, name: "hasFuturePricing" });
  const canApplyFreeOfCharge = useWatch({ control, name: "canApplyFreeOfCharge" });

  const isPaid = pricings.some((p) => p.isPaid);
  const hasErrors = errors.pricings != null;

  return (
    <EditAccordion forceOpen={hasErrors} heading={t("label.pricings")}>
      <Flex $gap="s">
        <Flex $direction="column" $gap="s">
          <ControlledCheckbox
            control={control}
            name="canApplyFreeOfCharge"
            label={t("label.canApplyFreeOfCharge")}
            tooltip={t("tooltip.canApplyFreeOfCharge")}
            disabled={!isPaid}
          />
          {canApplyFreeOfCharge && isPaid && (
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
          )}
          <HR />
        </Flex>
        {pricings
          .filter((p) => !p.isFuture)
          .map((pricing) => (
            <PricingControl key={pricing.pk} form={form} pricing={pricing} taxLevelOptions={taxLevelOptions} />
          ))}
        <FuturePricingContainer $gap="s" $toggled={hasFuturePricing}>
          <ControlledCheckbox control={control} name="hasFuturePricing" label={t("label.hasFuturePrice")} />
          {hasFuturePricing &&
            pricings
              .filter((p) => p.isFuture)
              .map((pricing) => (
                <PricingControl key={pricing.pk} form={form} pricing={pricing} taxLevelOptions={taxLevelOptions} />
              ))}
        </FuturePricingContainer>
      </Flex>
    </EditAccordion>
  );
}
