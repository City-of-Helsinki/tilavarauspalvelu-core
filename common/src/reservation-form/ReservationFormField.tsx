import { Checkbox, NumberInput, Select, TextArea, TextInput } from "hds-react";
import get from "lodash/get";
import React, { useMemo } from "react";
import {
  Control,
  Controller,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import styled from "styled-components";
import { fontMedium, fontRegular, Strongish } from "../common/typography";
import { ReservationsReservationReserveeTypeChoices } from "../../types/gql-types";
import { Inputs, Reservation } from "./types";
import { CheckboxWrapper } from "./components";
import { OptionType } from "../../types/common";
import { removeRefParam } from "./util";

type Props = {
  field: keyof Inputs;
  options: Record<string, OptionType[]>;
  reserveeType?: ReservationsReservationReserveeTypeChoices | "COMMON";
  reservation: Reservation;
  required: boolean;
  // Not good to pass the translation function here but this is because this is shared between ui and admin
  // and admin is lacking translation namespaces
  t: (key: string) => string;
  params?: Record<string, Record<string, string | number>>;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
};

const StyledCheckboxWrapper = styled(CheckboxWrapper)<{
  $isWide?: boolean;
  $break?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $break }) => $break && "margin-top: 0"}
`;

type TextAreaProps = {
  $isWide?: boolean;
  $hidden?: boolean;
  $break?: boolean;
  $height?: string;
};

const Subheading = styled(Strongish)`
  display: block;
  margin-bottom: var(--spacing-s);
`;

const StyledSelect = styled(Select)<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
`;

const StyledTextInput = styled(TextInput)<{
  $isWide?: boolean;
  $hidden?: boolean;
  $break?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};
  ${({ $break }) => $break && "grid-column: 1 / -2"};

  label {
    ${fontMedium};
  }
`;

const StyledTextArea = styled(TextArea).attrs(({ $height }: TextAreaProps) => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  style: { "--textarea-height": $height },
}))<TextAreaProps>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};
  ${({ $break }) => $break && "grid-column: 1 / -2"};

  label {
    ${fontMedium};
  }
`;

const StyledCheckbox = styled(Checkbox)`
  && label {
    ${fontRegular};
    line-height: var(--lineheight-l);

    a {
      text-decoration: underline;
      color: var(--color-black);
    }
  }
`;

const ControlledCheckbox = (props: {
  field: string;
  control: Control<FieldValues, boolean>;
  required: boolean;
  label: string;
  defaultValue?: boolean;
  errorText?: string;
  defaultChecked?: boolean;
}) => (
  <Controller
    name={props.field}
    control={props.control}
    defaultValue={props.defaultValue}
    rules={{ required: props.required }}
    render={({ field: { value, onChange } }) => (
      <StyledCheckbox
        id={props.field}
        onChange={(e) => onChange(e.target.checked)}
        checked={value}
        defaultChecked={props.defaultChecked}
        label={props.label}
        errorText={props.errorText}
      />
    )}
  />
);

const ReservationFormField = ({
  field,
  options,
  reserveeType,
  required,
  reservation,
  t,
  params = {},
  data = {},
}: Props) => {
  const normalizedReserveeType =
    reserveeType?.toLocaleLowerCase() || "individual";

  const isWideRow = useMemo(
    (): boolean =>
      [
        "name",
        "description",
        "reserveeAddressStreet",
        "applyingForFreeOfCharge",
        // "reserveeOrganisationName",
        "billingAddressStreet",
        "purpose",
      ].includes(field),
    [field]
  );

  const {
    watch,
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const isTextArea = useMemo(
    (): boolean => ["description"].includes(field),
    [field]
  );

  const isNumField = useMemo(
    (): boolean => ["numPersons"].includes(field),
    [field]
  );

  const isEmailField = useMemo(
    (): boolean => ["reserveeEmail", "billingEmail"].includes(field),
    [field]
  );

  const isBreakingColumn = useMemo(
    (): boolean =>
      [
        "showBillingAddress",
        "applyingForFreeOfCharge",
        "reserveeId",
        "reserveeIsUnregisteredAssociation",
      ].includes(field),
    [field]
  );

  const isReserveeIdRequired =
    field === "reserveeId" &&
    watch("reserveeIsUnregisteredAssociation") !== undefined
      ? watch("reserveeIsUnregisteredAssociation") !== true
      : required;

  const isFreeOfChargeReasonRequired =
    field === "freeOfChargeReason" && watch("applyingForFreeOfCharge") === true;

  const label = `${t(
    `reservationApplication:label.${normalizedReserveeType}.${field}`
  )}`;

  const error = get(errors, field);
  const errorText = error && t("forms:requiredField");

  const defaultValue = get(reservation, field);

  const checkParams = {
    field,
    control,
    defaultValue: typeof defaultValue === "boolean" ? defaultValue : undefined,
    label,
    required,
    errorText,
  };

  const emailPattern = {
    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    message: "email",
  };

  const minValue =
    get(params, field)?.min != null && !Number.isNaN(get(params, field).min)
      ? Number(get(params, field)?.min)
      : 1;
  const maxValue =
    get(params, field)?.max != null && !Number.isNaN(get(params, field).max)
      ? Number(get(params, field)?.max) < 200
        ? Number(get(params, field)?.max)
        : 200
      : undefined;

  return Object.keys(options).includes(field) ? (
    <Controller
      name={field}
      control={control}
      key={field}
      rules={{ required }}
      render={({ field: formField }) => (
        <StyledSelect
          // TODO some (like this) get the * added by the component
          // others (so far seems all the others) get it from the label text.
          label={t(
            `reservationApplication:label.${normalizedReserveeType}.${field}`
          )}
          id={field}
          options={options[field]}
          {...removeRefParam(formField)}
          value={
            typeof formField.value === "object"
              ? formField.value
              : options[field].find((n) => n.value === defaultValue) || null
          }
          error={errorText}
          required={required}
          invalid={!!error}
          $isWide={isWideRow}
        />
      )}
    />
  ) : field === "applyingForFreeOfCharge" ? (
    <StyledCheckboxWrapper
      key={field}
      $isWide={isWideRow}
      $break={isBreakingColumn}
    >
      <Subheading>
        {t("reservationApplication:label.subHeadings.subvention")}
      </Subheading>{" "}
      <ControlledCheckbox {...checkParams} />
      {data.termsForDiscount && (
        <div style={{ marginTop: "0.5rem" }}>{data.termsForDiscount}</div>
      )}
    </StyledCheckboxWrapper>
  ) : field === "reserveeIsUnregisteredAssociation" ? (
    <StyledCheckboxWrapper key={field} $break={isBreakingColumn}>
      <ControlledCheckbox
        {...checkParams}
        defaultChecked={watch("reserveeIsUnregisteredAssociation")}
      />
    </StyledCheckboxWrapper>
  ) : field === "showBillingAddress" ? (
    <StyledCheckboxWrapper key={field} $break={isBreakingColumn}>
      <ControlledCheckbox {...checkParams} />
    </StyledCheckboxWrapper>
  ) : field === "freeOfChargeReason" ? (
    <StyledTextArea
      // TODO this needs to be separated or use required like all the other components
      label={t(
        `reservationApplication:label.${normalizedReserveeType}.${field}`
      )}
      id={field}
      key={field}
      {...register(field, { required: isFreeOfChargeReasonRequired })}
      defaultValue={defaultValue ?? ""}
      errorText={errorText}
      invalid={!!error}
      required={isFreeOfChargeReasonRequired}
      $hidden={!watch("applyingForFreeOfCharge")}
      $isWide
      $height="92px"
    />
  ) : isNumField ? (
    <NumberInput
      label={`${label}`}
      id={field}
      {...register(field, {
        valueAsNumber: true,
        required,
        min: minValue,
        max: maxValue,
      })}
      key={field}
      errorText={
        error?.type === "min"
          ? t("forms:min")
          : error?.type === "max"
          ? t("forms:max")
          : errorText
      }
      invalid={!!error}
      required={required}
      step={1}
      minusStepButtonAriaLabel={t("common:decrease") || "Decrease"}
      plusStepButtonAriaLabel={t("common:increase") || "Increase"}
      min={minValue}
      max={maxValue}
    />
  ) : isTextArea ? (
    <StyledTextArea
      label={label}
      id={field}
      {...register(field, {
        required,
        ...(isEmailField && {
          pattern: emailPattern,
        }),
      })}
      key={field}
      defaultValue={defaultValue}
      errorText={
        error &&
        t(
          `forms:${
            get(errors, field)?.message === "email"
              ? "invalidEmail"
              : "requiredField"
          }`
        )
      }
      invalid={!!error}
      required={required}
      $isWide={isWideRow}
      $hidden={
        field.includes("billing") && watch("showBillingAddress") !== true
      }
      $break={isBreakingColumn}
      $height="119px"
    />
  ) : field === "reserveeId" ? (
    <StyledTextInput
      label={label}
      id={field}
      {...register(field, {
        required: isReserveeIdRequired,
      })}
      key={field}
      type="text"
      defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
      errorText={errorText}
      invalid={!!error}
      required={required}
      $isWide={isWideRow}
      $hidden={
        watch("reserveeIsUnregisteredAssociation") === undefined
          ? get(reservation, "reserveeIsUnregisteredAssociation") === true
          : watch("reserveeIsUnregisteredAssociation") === true
      }
      $break={isBreakingColumn}
    />
  ) : (
    <StyledTextInput
      label={label}
      id={field}
      {...register(field, {
        required,
        ...(isEmailField && {
          pattern: emailPattern,
        }),
      })}
      key={field}
      type="text"
      errorText={
        error &&
        String(
          t(
            `forms:${
              get(errors, field)?.message === "email"
                ? "invalidEmail"
                : "requiredField"
            }`
          )
        )
      }
      defaultValue={defaultValue ? String(defaultValue) : undefined}
      invalid={!!error}
      required={required}
      $isWide={isWideRow}
      $hidden={
        field.includes("billing") && watch("showBillingAddress") !== true
      }
      $break={isBreakingColumn}
    />
  );
};

export default ReservationFormField;
