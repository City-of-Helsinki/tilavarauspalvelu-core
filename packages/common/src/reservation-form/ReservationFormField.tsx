import { NumberInput, TextArea, TextInput } from "hds-react";
import { get } from "lodash-es";
import React, { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontMedium, Strongish } from "../../styled";
import { type ReserveeType } from "../../gql/gql-types";
import { type Inputs, type Reservation } from "./types";
import { type OptionsRecord } from "../../types/common";
import { ControlledCheckbox, ControlledSelect } from "../components/form";

type Props = {
  field: keyof Inputs;
  options: OptionsRecord;
  translationKey?: ReserveeType | "COMMON";
  reservation: Reservation;
  required: boolean;
  params?: Record<string, Record<string, string | number>>;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
};

const StyledCheckboxWrapper = styled.div<{
  $isWide?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
`;

type TextAreaProps = {
  $isWide?: boolean;
  $hidden?: boolean;
  $height?: string;
};

const Subheading = styled(Strongish)`
  display: block;
  margin-bottom: var(--spacing-s);
`;

const StyledControlledSelect = styled(ControlledSelect)<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
`;

const StyledTextInput = styled(TextInput)<{
  $isWide?: boolean;
  $hidden?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};

  label {
    ${fontMedium};
  }
`;

const StyledTextArea = styled(TextArea)<TextAreaProps>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};

  && {
    ${({ $height }) => ($height != null ? `--textarea-height: ${$height}` : "")};
  }

  label {
    ${fontMedium};
  }
`;

/* NOTE: backend returns validation errors if text fields are too long
 * remove maxlength after adding proper schema validation
 */
const MAX_TEXT_LENGTH = 255;

type FieldOptions = {
  ageGroup: OptionsRecord["ageGroups"];
  purpose: OptionsRecord["reservationPurposes"];
  muncipality: OptionsRecord["municipalities"];
};

// Fix to match the Field required options
export function convertOptionsToField(options: OptionsRecord): FieldOptions {
  return {
    ageGroup: options.ageGroups,
    purpose: options.reservationPurposes,
    muncipality: options.municipalities,
  };
}

export function ReservationFormField({
  field,
  options: originalOptions,
  translationKey,
  required,
  reservation,
  params = {},
  data = {},
}: Props) {
  const { t } = useTranslation();
  const options = convertOptionsToField(originalOptions);

  const lowerCaseTranslationKey = translationKey?.toLocaleLowerCase() || "individual";

  const isWideRow = useMemo(
    (): boolean =>
      ["name", "description", "reserveeAddressStreet", "applyingForFreeOfCharge", "purpose"].includes(field),
    [field]
  );

  const {
    watch,
    register,
    control,
    formState: { errors },
    trigger,
  } = useFormContext();

  const isTextArea = useMemo((): boolean => ["description"].includes(field), [field]);

  const isNumField = useMemo((): boolean => ["numPersons"].includes(field), [field]);

  const isEmailField = useMemo((): boolean => ["reserveeEmail"].includes(field), [field]);

  const isSelectField = Object.keys(options).includes(field);

  const isReserveeIdRequired =
    field === "reserveeIdentifier" && watch("reserveeIsUnregisteredAssociation") !== undefined
      ? watch("reserveeIsUnregisteredAssociation") !== true
      : required;

  const isFreeOfChargeReasonRequired = field === "freeOfChargeReason" && watch("applyingForFreeOfCharge") === true;

  const label = t(`reservationApplication:label.${lowerCaseTranslationKey}.${field}`);

  const minValue =
    get(params, field)?.min != null && !Number.isNaN(get(params, field).min) ? Number(get(params, field)?.min) : 1;
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
        if (field === "numPersons") return t("forms:minNumPersons", { minValue });
        break;
      case "max":
        if (field === "numPersons") return t("forms:maxNumPersons", { maxValue });
        break;
      case "minLength":
        if (field === "reserveeIdentifier") return t("forms:invalidReserveeId");
        return t("forms:minLength");
      case "maxLength":
        return t("forms:maxLength");
      // duplicated email errror messages because they can be added by zod schema or register pattern validators
      case "invalid_string":
        if (error.message === "Invalid email") {
          return t("forms:invalidEmail");
        }
        break;
      case "pattern":
        if (error.message === "email") {
          return t("forms:invalidEmail");
        }
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

  const emailPattern = {
    value: /^[A-ZÖÄÅ0-9._%+-]+@[A-ZÖÄÅ0-9.-]+\.[A-ZÖÄÅ]{2,}$/i,
    message: "email",
  };

  const id = `reservation-form-field__${field}`;
  if (isSelectField) {
    const optionsNarrowed = Object.keys(options).includes(field) ? options[field as keyof FieldOptions] : [];
    return (
      <StyledControlledSelect
        id={id}
        name={field}
        label={label}
        control={control}
        required={required}
        options={optionsNarrowed}
        error={errorText}
        placeholder={t("common:select")}
        afterChange={() => trigger(field)}
        $isWide={isWideRow}
        key={field}
      />
    );
  }
  if (isNumField) {
    return (
      <NumberInput
        label={label}
        id={id}
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
        minusStepButtonAriaLabel={t("common:subtract")}
        plusStepButtonAriaLabel={t("common:add")}
        min={minValue}
        max={maxValue}
        onChange={(e) => {
          trigger(field);
          register(field).onChange(e);
        }}
      />
    );
  }
  if (isTextArea) {
    return (
      <StyledTextArea
        label={label}
        id={id}
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
        maxLength={MAX_TEXT_LENGTH - (isEmailField ? 1 : 0)}
        $isWide={isWideRow}
        $height="119px"
      />
    );
  }

  const checkParams = {
    id,
    name: field,
    control,
    defaultValue: typeof defaultValue === "boolean" ? defaultValue : undefined,
    label,
    required,
    errorText,
  };

  switch (field) {
    case "applyingForFreeOfCharge":
      return (
        <StyledCheckboxWrapper key={field} $isWide={isWideRow}>
          <Subheading>{t("reservationApplication:label.subHeadings.subvention")}</Subheading>{" "}
          <ControlledCheckbox {...checkParams} />
          {data.termsForDiscount && <div style={{ marginTop: "0.5rem" }}>{data.termsForDiscount}</div>}
        </StyledCheckboxWrapper>
      );
    case "reserveeIsUnregisteredAssociation":
      return (
        <StyledCheckboxWrapper key={field}>
          <ControlledCheckbox {...checkParams} defaultValue={watch("reserveeIsUnregisteredAssociation")} />
        </StyledCheckboxWrapper>
      );
    case "freeOfChargeReason":
      return (
        <StyledTextArea
          label={label}
          id={id}
          key={field}
          {...register(field, { required: isFreeOfChargeReasonRequired })}
          defaultValue={defaultValue?.toString() ?? ""}
          errorText={errorText}
          invalid={!!error}
          required={isFreeOfChargeReasonRequired}
          maxLength={MAX_TEXT_LENGTH}
          $hidden={!watch("applyingForFreeOfCharge")}
          $isWide
          $height="92px"
        />
      );
    case "reserveeIdentifier":
      return (
        <StyledTextInput
          label={label}
          id={id}
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
          maxLength={MAX_TEXT_LENGTH}
          $isWide={isWideRow}
          $hidden={
            watch("reserveeIsUnregisteredAssociation") === undefined
              ? get(reservation, "reserveeIsUnregisteredAssociation") === true
              : watch("reserveeIsUnregisteredAssociation") === true
          }
        />
      );
    default:
      return (
        <StyledTextInput
          label={label}
          id={id}
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
          // email field is special and has one less character than the rest
          maxLength={MAX_TEXT_LENGTH - (isEmailField ? 1 : 0)}
          $isWide={isWideRow}
        />
      );
  }
}
