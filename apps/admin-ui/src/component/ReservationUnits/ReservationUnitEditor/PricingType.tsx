import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  DateInput,
  IconAlertCircleFill,
  NumberInput,
  RadioButton,
  Select,
} from "hds-react";
import {
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
} from "common/types/gql-types";
import { Controller, UseFormReturn } from "react-hook-form";
import { Grid, Span3, Span4, Span6 } from "@/styles/layout";
import { ReservationUnitEditFormValues } from "./form";
import { PaymentTypes } from "./types";

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
  index: number;
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxPercentageOptions: { label: string; value: number }[];
};

function PaidPricingPart({
  form,
  index,
  taxPercentageOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  index: number;
  taxPercentageOptions: { label: string; value: number }[];
}) {
  const { t } = useTranslation();
  const { control, formState, register, watch } = form;
  const { errors } = formState;

  const unitPriceOptions = Object.values(
    ReservationUnitsReservationUnitPricingPriceUnitChoices
  ).map((choice) => ({
    value: choice,
    label: t(`priceUnit.${choice}`),
  }));

  const paymentTypeOptions = PaymentTypes.map((value: string) => ({
    label: t(`paymentType.${value}`),
    value,
  }));

  const pricing = watch(`pricings.${index}`);

  return (
    <>
      <Span6>
        <Controller
          name={`pricings.${index}.priceUnit`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              id={`pricings.${index}.priceUnit`}
              placeholder={t("common.select")}
              label={t("ReservationUnitEditor.label.priceUnit")}
              required
              options={unitPriceOptions}
              onChange={(v: {
                value: ReservationUnitsReservationUnitPricingPriceUnitChoices;
                label: string;
              }) => onChange(v.value)}
              value={
                unitPriceOptions.find((option) => option.value === value) ??
                null
              }
              tooltipText={t("ReservationUnitEditor.tooltip.priceUnit")}
              error={errors.pricings?.[index]?.priceUnit?.message}
              invalid={errors.pricings?.[index]?.priceUnit?.message != null}
            />
          )}
        />
      </Span6>

      <Span6>
        <Controller
          name={`pricings.${index}.taxPercentage.pk`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              id={`pricings.${index}.taxPercentage.pk`}
              placeholder={t("common.select")}
              required
              label={t(`ReservationUnitEditor.label.taxPercentagePk`)}
              options={taxPercentageOptions}
              onChange={(v: { value: number; label: string }) =>
                onChange(v.value)
              }
              value={
                taxPercentageOptions.find((option) => option.value === value) ??
                null
              }
              error={errors.pricings?.[index]?.taxPercentage?.message}
              invalid={errors.pricings?.[index]?.taxPercentage?.message != null}
            />
          )}
        />
      </Span6>

      <Span3>
        <NumberInput
          {...register(`pricings.${index}.lowestPriceNet`, {
            required: true,
            valueAsNumber: true,
          })}
          value={pricing?.lowestPriceNet ?? 0}
          id={`pricings.${index}.lowestPriceNet`}
          required
          label={t("ReservationUnitEditor.label.lowestPriceNet")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          step={1}
          min={0}
          max={undefined}
          errorText={errors.pricings?.[index]?.lowestPriceNet?.message}
          invalid={errors.pricings?.[index]?.lowestPriceNet?.message != null}
        />
      </Span3>
      <Span3>
        <NumberInput
          {...register(`pricings.${index}.lowestPrice`, {
            required: true,
            valueAsNumber: true,
          })}
          id={`pricings.${index}.lowestPrice`}
          required
          label={t("ReservationUnitEditor.label.lowestPrice")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          step={1}
          min={0}
          max={undefined}
          errorText={errors.pricings?.[index]?.lowestPrice?.message}
          invalid={errors.pricings?.[index]?.lowestPrice?.message != null}
          tooltipText={t("ReservationUnitEditor.tooltip.lowestPrice")}
        />
      </Span3>
      <Span3>
        <NumberInput
          // TODO controller
          {...register(`pricings.${index}.highestPriceNet`, {
            required: true,
            valueAsNumber: true,
          })}
          required
          id={`pricings.${index}.highestPriceNet`}
          label={t("ReservationUnitEditor.label.highestPriceNet")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          step={1}
          min={0}
          max={undefined}
          errorText={errors.pricings?.[index]?.highestPriceNet?.message}
          invalid={errors.pricings?.[index]?.highestPriceNet?.message != null}
        />
      </Span3>
      <Span3>
        <NumberInput
          {...register(`pricings.${index}.highestPrice`, {
            required: true,
            valueAsNumber: true,
          })}
          required
          id={`pricings.${index}.highestPrice`}
          label={t("ReservationUnitEditor.label.highestPrice")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          step={1}
          min={0}
          max={undefined}
          type="number"
          errorText={errors.pricings?.[index]?.highestPrice?.message}
          invalid={errors.pricings?.[index]?.highestPrice?.message != null}
          tooltipText={t("ReservationUnitEditor.tooltip.highestPrice")}
        />
      </Span3>
      <Span3>
        <Controller
          // This is not pricing type specific
          name="paymentTypes"
          control={control}
          render={({ field: { value, onChange } }) => (
            <Select
              id={`pricings.${index}.paymentTypes`}
              // sort
              multiselect
              required
              placeholder={t("common.select")}
              // @ts-expect-error -- Something weird with HDS multiselect typing
              options={paymentTypeOptions}
              onChange={(x: { value: string; label: string }[]) => {
                onChange(
                  x.map((y: { value: string; label: string }) => y.value)
                );
              }}
              value={paymentTypeOptions.filter(
                (x) => value.find((d) => d === x.value) != null
              )}
              label={t("ReservationUnitEditor.label.paymentTypes")}
              tooltipText={t("ReservationUnitEditor.tooltip.paymentTypes")}
              errorText={errors.paymentTypes?.message}
              invalid={errors.paymentTypes?.message != null}
            />
          )}
        />
      </Span3>
    </>
  );
}

export function PricingType({
  index,
  form,
  taxPercentageOptions,
}: Props): JSX.Element | null {
  const { t } = useTranslation();

  const { control, formState, watch } = form;
  const { errors } = formState;

  const pricing = watch(`pricings.${index}`);

  const priceOptions = [
    ReservationUnitsReservationUnitPricingPricingTypeChoices.Free,
    ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
  ] as const;
  return (
    <Grid>
      {pricing?.status === "FUTURE" && (
        <Span3>
          <Controller
            name={`pricings.${index}.begins`}
            control={control}
            render={({ field: { value, onChange } }) => (
              <DateInput
                id="futureDate"
                value={value}
                onChange={(val) => onChange(val)}
              />
            )}
          />
        </Span3>
      )}
      <Controller
        name={`pricings.${index}.pricingType`}
        control={control}
        render={({ field: { value, onChange } }) => (
          <>
            {priceOptions.map((type) => (
              <Span4 key={`pricings.${index}.pricingType.${type}`}>
                <RadioButton
                  id={`pricingType.${index}.${pricing.status}.${type}`}
                  name={`pricingType.${index}.${pricing.status}`}
                  label={t(`ReservationUnitEditor.label.pricingTypes.${type}`)}
                  value={type}
                  checked={value === type}
                  onChange={onChange}
                />
              </Span4>
            ))}
          </>
        )}
      />
      {errors.pricings?.message != null && (
        <Error>
          <IconAlertCircleFill />
          <span>{errors.pricings.message}</span>
        </Error>
      )}
      {pricing?.pricingType === "PAID" && (
        <PaidPricingPart
          form={form}
          index={index}
          taxPercentageOptions={taxPercentageOptions}
        />
      )}
    </Grid>
  );
}
