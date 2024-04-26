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
import { PriceUnit, PricingType } from "common/types/gql-types";
import { Controller, UseFormReturn } from "react-hook-form";
import { addDays } from "date-fns";
import { AutoGrid } from "@/styles/layout";
import { getTranslatedError } from "@/common/util";
import { type ReservationUnitEditFormValues, PaymentTypes } from "./form";

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
  const { control, setValue, formState, register, watch } = form;
  const { errors } = formState;

  const unitPriceOptions = Object.values(PriceUnit).map((choice) => ({
    value: choice,
    label: t(`priceUnit.${choice}`),
  }));

  const paymentTypeOptions = PaymentTypes.map((value: string) => ({
    label: t(`paymentType.${value}`),
    value,
  }));

  const removeTax = (price: number, taxPercentage: number) => {
    const tmp = (price * 100) / (100 + taxPercentage);
    const tmp2 = Math.round(tmp * 100) / 100;
    return tmp2;
  };

  const addTax = (price: number, taxPercentage: number) => {
    const tmp = price * ((100 + taxPercentage) / 100);
    const tmp2 = Math.round(tmp * 100) / 100;
    return tmp2;
  };

  const pricing = watch(`pricings.${index}`);

  const taxPercentage = watch(`pricings.${index}.taxPercentage`).value ?? 0;

  // TODO mobile number keyboard?
  return (
    <>
      <Controller
        name={`pricings.${index}.priceUnit`}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Select
            id={`pricings.${index}.priceUnit`}
            placeholder={t("common.select")}
            label={t("ReservationUnitEditor.label.priceUnit")}
            style={{ gridColumnStart: "1" }}
            required
            options={unitPriceOptions}
            onChange={(v: { value: PriceUnit; label: string }) =>
              onChange(v.value)
            }
            value={
              unitPriceOptions.find((option) => option.value === value) ?? null
            }
            tooltipText={t("ReservationUnitEditor.tooltip.priceUnit")}
            error={getTranslatedError(
              t,
              errors.pricings?.[index]?.priceUnit?.message
            )}
            invalid={errors.pricings?.[index]?.priceUnit?.message != null}
          />
        )}
      />
      <Controller
        name={`pricings.${index}.taxPercentage`}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Select
            id={`pricings.${index}.taxPercentage.pk`}
            placeholder={t("common.select")}
            required
            label={t(`ReservationUnitEditor.label.taxPercentage`)}
            options={taxPercentageOptions}
            onChange={(v: { value: number; label: string }) => {
              onChange({ pk: v.value, value: Number(v.label) });
              const low = Number(pricing?.lowestPrice);
              const high = Number(pricing?.highestPrice);
              const tax = pricing?.taxPercentage.value ?? 0;
              if (!Number.isNaN(low)) {
                const lowNet = removeTax(low, tax);
                setValue(`pricings.${index}.lowestPriceNet`, lowNet);
              }
              if (!Number.isNaN(high)) {
                const highNet = removeTax(high, tax);
                setValue(`pricings.${index}.highestPriceNet`, highNet);
              }
            }}
            value={
              taxPercentageOptions.find(
                (option) => option.value === value.pk
              ) ?? null
            }
            error={getTranslatedError(
              t,
              errors.pricings?.[index]?.taxPercentage?.message
            )}
            invalid={errors.pricings?.[index]?.taxPercentage?.message != null}
          />
        )}
      />
      <NumberInput
        {...register(`pricings.${index}.lowestPriceNet`, {
          required: true,
          onChange: (e) => {
            const val = Number(e.currentTarget.value);
            if (!Number.isNaN(val)) {
              setValue(
                `pricings.${index}.lowestPrice`,
                addTax(val, taxPercentage)
              );
            }
          },
          setValueAs: (val) => (val !== "" ? Number(val) : null),
        })}
        id={`pricings.${index}.lowestPriceNet`}
        required
        label={t("ReservationUnitEditor.label.lowestPriceNet")}
        minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
        plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
        step={1}
        min={0}
        max={undefined}
        errorText={getTranslatedError(
          t,
          errors.pricings?.[index]?.lowestPriceNet?.message
        )}
        invalid={errors.pricings?.[index]?.lowestPriceNet?.message != null}
      />
      <NumberInput
        {...register(`pricings.${index}.lowestPrice`, {
          required: true,
          onChange: (e) => {
            const val = Number(e.currentTarget.value);
            if (!Number.isNaN(val)) {
              setValue(
                `pricings.${index}.lowestPriceNet`,
                removeTax(val, taxPercentage)
              );
            }
          },
          setValueAs: (val) => (val !== "" ? Number(val) : null),
        })}
        id={`pricings.${index}.lowestPrice`}
        required
        label={t("ReservationUnitEditor.label.lowestPrice")}
        minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
        plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
        step={1}
        min={0}
        max={undefined}
        errorText={getTranslatedError(
          t,
          errors.pricings?.[index]?.lowestPrice?.message
        )}
        invalid={errors.pricings?.[index]?.lowestPrice?.message != null}
        tooltipText={t("ReservationUnitEditor.tooltip.lowestPrice")}
      />
      <NumberInput
        {...register(`pricings.${index}.highestPriceNet`, {
          required: true,
          onChange: (e) => {
            const val = Number(e.currentTarget.value);
            if (!Number.isNaN(val)) {
              setValue(
                `pricings.${index}.highestPrice`,
                addTax(val, taxPercentage)
              );
            }
          },
          setValueAs: (val) => (val !== "" ? Number(val) : null),
        })}
        required
        id={`pricings.${index}.highestPriceNet`}
        label={t("ReservationUnitEditor.label.highestPriceNet")}
        minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
        plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
        step={1}
        min={0}
        max={undefined}
        errorText={getTranslatedError(
          t,
          errors.pricings?.[index]?.highestPriceNet?.message
        )}
        invalid={errors.pricings?.[index]?.highestPriceNet?.message != null}
      />
      <NumberInput
        {...register(`pricings.${index}.highestPrice`, {
          required: true,
          onChange: (e) => {
            const val = Number(e.currentTarget.value);
            if (!Number.isNaN(val)) {
              setValue(
                `pricings.${index}.highestPriceNet`,
                removeTax(val, taxPercentage)
              );
            }
          },
          setValueAs: (val) => (val !== "" ? Number(val) : null),
        })}
        required
        id={`pricings.${index}.highestPrice`}
        label={t("ReservationUnitEditor.label.highestPrice")}
        minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
        plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
        step={1}
        min={0}
        max={undefined}
        errorText={getTranslatedError(
          t,
          errors.pricings?.[index]?.highestPrice?.message
        )}
        invalid={errors.pricings?.[index]?.highestPrice?.message != null}
        tooltipText={t("ReservationUnitEditor.tooltip.highestPrice")}
      />
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
              onChange(x.map((y: { value: string; label: string }) => y.value));
            }}
            value={paymentTypeOptions.filter(
              (x) => value.find((d) => d === x.value) != null
            )}
            label={t("ReservationUnitEditor.label.paymentTypes")}
            tooltipText={t("ReservationUnitEditor.tooltip.paymentTypes")}
            error={getTranslatedError(t, errors.paymentTypes?.message)}
            invalid={errors.paymentTypes?.message != null}
          />
        )}
      />
    </>
  );
}

export function PricingTypeView({
  index,
  form,
  taxPercentageOptions,
}: Props): JSX.Element | null {
  const { t } = useTranslation();

  const { control, formState, watch } = form;
  const { errors } = formState;

  const pricing = watch(`pricings.${index}`);

  const priceOptions = [PricingType.Free, PricingType.Paid] as const;

  return (
    <AutoGrid>
      {pricing?.status === "FUTURE" && (
        <Controller
          name={`pricings.${index}.begins`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <DateInput
              id="futureDate"
              value={value}
              onChange={(val) => onChange(val)}
              minDate={addDays(new Date(), 1)}
              invalid={errors.pricings?.[index]?.begins?.message != null}
              errorText={getTranslatedError(
                t,
                errors.pricings?.[index]?.begins?.message
              )}
            />
          )}
        />
      )}
      <Controller
        name={`pricings.${index}.pricingType`}
        control={control}
        render={({ field: { value, onChange } }) => (
          <>
            {priceOptions.map((type) => (
              <RadioButton
                key={`pricings.${index}.pricingType.${type}`}
                id={`pricingType.${index}.${pricing.status}.${type}`}
                name={`pricingType.${index}.${pricing.status}`}
                label={t(`ReservationUnitEditor.label.pricingTypes.${type}`)}
                value={type}
                checked={value === type}
                onChange={onChange}
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
      {pricing?.pricingType === PricingType.Paid && (
        <PaidPricingPart
          form={form}
          index={index}
          taxPercentageOptions={taxPercentageOptions}
        />
      )}
    </AutoGrid>
  );
}
