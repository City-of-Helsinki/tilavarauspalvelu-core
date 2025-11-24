import React from "react";
import { type Control, Controller, UseFormReturn } from "react-hook-form";
import { addDays, startOfDay } from "date-fns";
import { IconAlertCircleFill, RadioButton } from "hds-react";
import { capitalize } from "lodash-es";
import { useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import styled from "styled-components";
import {
  ControlledDateInput,
  ControlledNumberInput,
  ControlledSelect,
  ControlledCheckbox,
} from "ui/src/components/form";
import { AutoGrid, Flex, HR } from "ui/src/styled";
import { getTranslatedError } from "@/modules/helpers";
import { PaymentType, PriceUnit } from "@gql/gql-types";
import { FieldGroup } from "./FieldGroup";
import { ReservationUnitEditFormValues } from "./form";
import { EditAccordion } from "./styled";

const RichTextInput = dynamic(() => import("@/components/RichTextInput"), {
  ssr: false,
});

const FuturePricingContainer = styled(Flex)<{ $toggled: boolean }>`
  padding-block: var(--spacing-s);
  ${({ $toggled }) => $toggled && "background: var(--color-black-5);"}
`;

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
  const { t } = useTranslation("reservationUnitEditor");
  const { control, setValue, formState, watch } = form;
  const { errors } = formState;

  // TODO this should be sorted (it's sorted in graphql schema, but codegen randomises the order)
  const unitPriceOptions = Object.values(PriceUnit).map((choice) => ({
    label: t(`translation:priceUnit.${choice}`),
    value: choice,
  }));

  const paymentTypeOptions = Object.values(PaymentType).map((choice) => ({
    label: t(`translation:paymentType.${choice}`),
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
        label={t("label.priceUnit")}
        style={{ gridColumnStart: "1" }}
        required
        options={unitPriceOptions}
        tooltip={t("tooltip.priceUnit")}
        error={getTranslatedError(t, errors.pricings?.[index]?.priceUnit?.message)}
      />
      <ControlledSelect
        name={`pricings.${index}.taxPercentage`}
        control={control}
        required
        label={t(`label.taxPercentage`)}
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
        label={t("label.lowestPriceNet")}
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
        label={t("label.lowestPrice")}
        tooltipText={t("tooltip.lowestPrice")}
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
        label={t("label.highestPriceNet")}
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
        label={t("label.highestPrice")}
        tooltipText={t("tooltip.highestPrice")}
        min={0}
        errorText={getTranslatedError(t, errors.pricings?.[index]?.highestPrice?.message)}
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
  pricing: ReservationUnitEditFormValues["pricings"][0];
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxPercentageOptions: TaxOption[];
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
        <PricingTypeView pk={pricing.pk} form={form} taxPercentageOptions={taxPercentageOptions} />
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
        />
      )}
    />
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
  const { t } = useTranslation("reservationUnitEditor");
  const { control, watch, formState } = form;
  const { errors } = formState;

  const pricings = watch("pricings");
  const isPaid = pricings.some((p) => p.isPaid).length > 0;
  const hasErrors = errors.pricings != null;

  return (
    <EditAccordion open={hasErrors} heading={t("label.pricings")}>
      <Flex $gap="s">
        <Flex $direction="column" $gap="s">
          <ControlledCheckbox
            control={control}
            name="canApplyFreeOfCharge"
            label={t("label.canApplyFreeOfCharge")}
            tooltip={t("tooltip.canApplyFreeOfCharge")}
            disabled={!isPaid}
          />
          {watch("canApplyFreeOfCharge") && isPaid && (
            <ControlledSelect
              control={control}
              name="pricingTerms"
              label={t("label.pricingTerms")}
              required
              clearable
              options={pricingTermsOptions}
              error={getTranslatedError(t, errors.pricingTerms?.message)}
              tooltip={t("tooltip.pricingTerms")}
              enableSearch
            />
          )}
          <HR />
        </Flex>
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
        <FuturePricingContainer $gap="s" $toggled={watch("hasFuturePricing")}>
          <ControlledCheckbox control={control} name="hasFuturePricing" label={t("label.hasFuturePrice")} />
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
        </FuturePricingContainer>
      </Flex>
    </EditAccordion>
  );
}
