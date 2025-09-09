import { NumberInput, TextArea, TextInput } from "hds-react";
import { get } from "lodash-es";
import React, { useMemo } from "react";
import { useFormContext, type UseFormRegister } from "react-hook-form";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontMedium, Strongish } from "../styled";
import { ReserveeType } from "../../gql/gql-types";
import { type ReservationFormT } from "./types";
import { type OptionsRecord } from "../../types/common";
import { ControlledCheckbox, ControlledSelect } from "../components/form";

type Props = {
  field: keyof ReservationFormT;
  options: OptionsRecord;
  translationKey?: ReserveeType | "COMMON";
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

const StyledControlledSelect = styled(ControlledSelect<ReservationFormT>)<{ $isWide?: boolean }>`
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

export function ReservationFormField({ field, options, translationKey, required, params = {}, data = {} }: Props) {
  const { t } = useTranslation();

  const isWideRow = ["name", "applyingForFreeOfCharge", "purpose"].includes(field);

  const {
    watch,
    register,
    control,
    formState: { errors },
    trigger,
  } = useFormContext<ReservationFormT>();

  const isSelectField = Object.keys(options).includes(field);

  const isReserveeIdRequired = watch("reserveeIsUnregisteredAssociation") === true;

  const isFreeOfChargeReasonRequired = field === "freeOfChargeReason" && watch("applyingForFreeOfCharge") === true;

  const lowerCaseTranslationKey = translationKey?.toLocaleLowerCase() || "individual";
  const label = t(`reservationApplication:label.${lowerCaseTranslationKey}.${field}`);

  const isNumField = "numPersons" === field;
  const minValue =
    get(params, field)?.min != null && !Number.isNaN(get(params, field).min) ? Number(get(params, field)?.min) : 1;
  const maxValue =
    get(params, field)?.max != null && !Number.isNaN(get(params, field).max)
      ? Number(get(params, field)?.max) < 200
        ? Number(get(params, field)?.max)
        : 200
      : undefined;

  const error = get(errors, field);

  const errorPrefix = isSelectField ? t("forms:prefix.select") : t("forms:prefix.text");

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

  const id = `reservation-form-field__${field}`;
  if (isSelectField) {
    const optionsNarrowed = Object.keys(options).includes(field) ? options[field as keyof OptionsRecord] : [];
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

  const shouldHideOrganisationIdentifier =
    watch("reserveeType") === ReserveeType.Nonprofit && watch("reserveeIsUnregisteredAssociation") === true;

  const checkParams = {
    id,
    name: field,
    control,
    label,
    required,
    errorText,
  };

  switch (field) {
    case "description":
      return <DescriptionField field={field} label={label} errorText={errorText} register={register} id={id} />;
    case "applyingForFreeOfCharge":
      return (
        <StyledCheckboxWrapper key={field} $isWide={isWideRow}>
          <Subheading>{t("reservationApplication:label.subHeadings.subvention")}</Subheading>{" "}
          <ControlledCheckbox {...checkParams} />
          {data.termsForDiscount && <div style={{ marginTop: "0.5rem" }}>{data.termsForDiscount}</div>}
        </StyledCheckboxWrapper>
      );
    case "reserveeIsUnregisteredAssociation":
      if (watch("reserveeType") !== ReserveeType.Nonprofit) {
        return null;
      }
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
          errorText={errorText}
          invalid={!!error}
          required={required}
          maxLength={MAX_TEXT_LENGTH}
          $isWide={isWideRow}
          disabled={shouldHideOrganisationIdentifier}
        />
      );
    case "reserveeEmail":
      return <EmailInput label={label} field={field} register={register} errorText={errorText} id={id} />;
    default:
      return (
        <StyledTextInput
          label={label}
          id={id}
          {...register(field, { required })}
          key={field}
          type="text"
          errorText={errorText}
          invalid={!!error}
          required={required}
          maxLength={MAX_TEXT_LENGTH}
          $isWide={isWideRow}
        />
      );
  }
}

function DescriptionField({
  id,
  label,
  field,
  register,
  errorText,
}: {
  id: string;
  label: string;
  field: keyof ReservationFormT;
  register: UseFormRegister<ReservationFormT>;
  errorText: string;
}): React.ReactElement {
  const required = true;
  return (
    <StyledTextArea
      label={label}
      id={id}
      {...register(field, { required })}
      key={field}
      errorText={errorText}
      invalid={errorText !== ""}
      required
      maxLength={MAX_TEXT_LENGTH}
      $isWide
      $height="119px"
    />
  );
}

function EmailInput({
  id,
  label,
  field,
  register,
  errorText,
}: {
  id: string;
  label: string;
  field: keyof ReservationFormT;
  register: UseFormRegister<ReservationFormT>;
  errorText: string;
}): React.ReactElement {
  const isEmailField = true;
  const required = true;

  const emailPattern = {
    value: /^[A-ZÖÄÅ0-9._%+-]+@[A-ZÖÄÅ0-9.-]+\.[A-ZÖÄÅ]{2,}$/i,
    message: "email",
  };

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
      invalid={errorText !== ""}
      required={required}
      // email field is special and has one less character than the rest
      maxLength={MAX_TEXT_LENGTH - (isEmailField ? 1 : 0)}
    />
  );
}
