import { Checkbox, NumberInput, Select, TextArea, TextInput } from "hds-react";
import get from "lodash/get";
import React, { useMemo } from "react";
import {
  Control,
  Controller,
  FieldValues,
  useFormContext,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
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
  translationKey?: ReservationsReservationReserveeTypeChoices | "COMMON";
  reservation: Reservation;
  required: boolean;
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

const StyledTextArea = styled(TextArea)<TextAreaProps>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};
  ${({ $break }) => $break && "grid-column: 1 / -2"};

  && {
    ${({ $height }) =>
      $height != null ? `--textarea-height: ${$height}` : ""};
  }

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
  translationKey,
  required,
  reservation,
  params = {},
  data = {},
}: Props) => {
  const { t } = useTranslation();

  const lowerCaseTranslationKey =
    translationKey?.toLocaleLowerCase() || "individual";

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
    trigger,
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

  const isSelectField = Object.keys(options).includes(field);

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
    `reservationApplication:label.${lowerCaseTranslationKey}.${field}`
  )}`;

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

  const error = get(errors, field);

  const errorPrefix = useMemo(() => {
    if (isSelectField) return t("forms:prefix.select");

    return t("forms:prefix.text");
  }, [isSelectField, t]);

  const errorText = useMemo(() => {
    if (!error || !field) return "";

    switch (error.type) {
      case "min":
        if (field === "numPersons")
          return t("forms:minNumPersons", { minValue });
        break;
      case "max":
        if (field === "numPersons")
          return t("forms:maxNumPersons", { maxValue });
        break;
      case "minLength":
        if (field === "reserveeId") return t("forms:invalidReserveeId");
        return t("forms:minLength");
      case "maxLength":
        return t("forms:maxLength");
      case "pattern":
        if (error.message === "email") return t("forms:invalidEmail");
        break;
      case "required":
      default:
        return t("forms:requiredField", {
          prefix: errorPrefix,
          fieldName: label.toLocaleLowerCase(),
        });
    }

    return "";
  }, [error, field, label, t, minValue, maxValue, errorPrefix]);

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
    value: /^[A-ZÖÄÅ0-9._%+-]+@[A-ZÖÄÅ0-9.-]+\.[A-ZÖÄÅ]{2,}$/i,
    message: "email",
  };

  return isSelectField ? (
    <Controller
      name={field}
      control={control}
      key={field}
      rules={{ required }}
      render={({ field: formField }) => (
        <StyledSelect
          label={label}
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
      label={label}
      id={field}
      key={field}
      {...register(field, { required: isFreeOfChargeReasonRequired })}
      defaultValue={defaultValue?.toString() ?? ""}
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
      errorText={errorText}
      invalid={!!error}
      required={required}
      step={1}
      minusStepButtonAriaLabel={t("common:decrease") || "Decrease"}
      plusStepButtonAriaLabel={t("common:increase") || "Increase"}
      min={minValue}
      max={maxValue}
      onChange={(e) => {
        trigger(field);
        register(field).onChange(e);
      }}
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
      defaultValue={defaultValue?.toString() ?? ""}
      errorText={errorText}
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
        minLength: 3,
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
      errorText={errorText}
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
