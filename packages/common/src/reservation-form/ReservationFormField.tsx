import React from "react";
import { TextArea, TextInput } from "hds-react";
import { FieldError, useFormContext, type UseFormRegister } from "react-hook-form";
import { TFunction, useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontMedium, Strongish } from "../../styled";
import { ReserveeType } from "../../gql/gql-types";
import { type OptionsRecord } from "../../types/common";
import { ControlledCheckbox, ControlledNumberInput, ControlledSelect } from "../components/form";
import { type ReservationFormValueT } from "../schemas";
import { filterEmptyString } from "../helpers";

type Props = {
  field: keyof ReservationFormValueT;
  options: OptionsRecord;
  translationKey?: ReserveeType | "COMMON";
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

const StyledControlledSelect = styled(ControlledSelect<ReservationFormValueT>)<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};

  label {
    ${fontMedium};
  }
`;

const StyledTextInput = styled(TextInput)<{
  $isWide?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};

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
  municipality: OptionsRecord["municipalities"];
};

// Fix to match the Field required options
export function convertOptionsToField(options: OptionsRecord): FieldOptions {
  return {
    ageGroup: options.ageGroups,
    purpose: options.reservationPurposes,
    municipality: options.municipalities,
  };
}

// TODO refactor so the fieldLabel is not already translated
export function translateReserveeFormError(
  t: TFunction,
  fieldLabel: string,
  error: FieldError | undefined
): string | undefined {
  if (error == null) {
    return undefined;
  }

  // custom error message can be set, but not type
  if (error.message === "Required" || error.type === "invalid_type") {
    return t("forms:Required", { fieldName: fieldLabel });
  } else if (error.message === "Invalid email") {
    return t("forms:invalidEmail");
  }

  /* TODO do we need this still? and how we manipulate it
  switch (error.type) {
    case "min":
      if (field === "numPersons") return t("forms:minNumPersons", { minValue });
      break;
    case "max":
      if (field === "numPersons") return t("forms:maxNumPersons", { maxValue });
      break;
  }
  */

  return error.message;
}

export function constructReservationFieldId(field: keyof ReservationFormValueT) {
  return `reservation-form-field__${field}`;
}

export function ReservationFormField({ field, options: originalOptions, translationKey, data = {} }: Props) {
  const { t } = useTranslation();
  const options = convertOptionsToField(originalOptions);

  const {
    watch,
    register,
    control,
    formState: { errors },
  } = useFormContext<ReservationFormValueT>();

  const lowerCaseTranslationKey = translationKey?.toLocaleLowerCase() || "individual";
  const label = t(`reservationApplication:label.${lowerCaseTranslationKey}.${field}`);

  const errorText = translateReserveeFormError(t, label, errors[`${field}`]);

  const id = constructReservationFieldId(field);

  const isSelectField = Object.keys(options).includes(field);

  if (isSelectField) {
    const optionsNarrowed = Object.keys(options).includes(field) ? options[field as keyof FieldOptions] : [];
    return (
      <StyledControlledSelect
        id={id}
        name={field}
        label={label}
        control={control}
        required
        options={optionsNarrowed}
        error={filterEmptyString(errorText)}
        $isWide={field === "purpose"}
        key={field}
      />
    );
  }

  const checkParams = {
    id,
    name: field,
    control,
    label,
    errorText,
  };

  switch (field) {
    case "numPersons": {
      /*
      const minValue =
        get(params, field)?.min != null && !Number.isNaN(get(params, field).min) ? Number(get(params, field)?.min) : 1;
      const maxValue =
        get(params, field)?.max != null && !Number.isNaN(get(params, field).max)
          ? Number(get(params, field)?.max) < 200
            ? Number(get(params, field)?.max)
            : 200
          : undefined;
      */

      return (
        <ControlledNumberInput<ReservationFormValueT>
          name={field}
          control={control}
          label={label}
          key={field}
          errorText={errorText}
          required
          min={1} //minValue}
          // max={maxValue}
        />
      );
    }
    case "description":
      return <DescriptionField field={field} label={label} errorText={errorText} register={register} id={id} />;
    case "applyingForFreeOfCharge":
      return (
        <StyledCheckboxWrapper key={field} $isWide>
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
          <ControlledCheckbox {...checkParams} />
        </StyledCheckboxWrapper>
      );
    case "freeOfChargeReason":
      return (
        <StyledTextArea
          label={label}
          id={id}
          key={field}
          {...register(field)}
          errorText={errorText}
          invalid={filterEmptyString(errorText) != null}
          required
          maxLength={MAX_TEXT_LENGTH}
          $hidden={!watch("applyingForFreeOfCharge")}
          $isWide
          $height="92px"
        />
      );
    case "reserveeIdentifier": {
      const shouldHideOrganisationIdentifier =
        watch("reserveeType") === ReserveeType.Nonprofit && watch("reserveeIsUnregisteredAssociation") === true;

      return (
        <StyledTextInput
          label={label}
          id={id}
          {...register(field)}
          key={field}
          type="text"
          errorText={errorText}
          invalid={filterEmptyString(errorText) != null}
          required={!shouldHideOrganisationIdentifier}
          maxLength={MAX_TEXT_LENGTH}
          disabled={shouldHideOrganisationIdentifier}
        />
      );
    }
    case "reserveeEmail":
      return <EmailInput label={label} field={field} register={register} errorText={errorText} id={id} />;
    default: {
      return (
        <StyledTextInput
          label={label}
          id={id}
          {...register(field)}
          key={field}
          type="text"
          errorText={filterEmptyString(errorText)}
          invalid={filterEmptyString(errorText) != null}
          required
          maxLength={MAX_TEXT_LENGTH}
          $isWide={field === "name"}
        />
      );
    }
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
  field: keyof ReservationFormValueT;
  register: UseFormRegister<ReservationFormValueT>;
  errorText?: string;
}): React.ReactElement {
  return (
    <StyledTextArea
      label={label}
      id={id}
      {...register(field)}
      key={field}
      errorText={filterEmptyString(errorText)}
      invalid={filterEmptyString(errorText) != null}
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
  field: keyof ReservationFormValueT;
  register: UseFormRegister<ReservationFormValueT>;
  errorText?: string;
}): React.ReactElement {
  const isEmailField = true;
  return (
    <StyledTextInput
      label={label}
      id={id}
      {...register(field)}
      key={field}
      type="text"
      errorText={filterEmptyString(errorText)}
      invalid={filterEmptyString(errorText) != null}
      required
      // email field is special and has one less character than the rest
      maxLength={MAX_TEXT_LENGTH - (isEmailField ? 1 : 0)}
    />
  );
}
