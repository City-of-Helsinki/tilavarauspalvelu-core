import React from "react";
import { useFormContext, type UseFormRegister } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ReserveeType } from "../../gql/gql-types";
import { type OptionsRecord } from "../../types/common";
import { ControlledCheckbox, ControlledNumberInput, ControlledSelect } from "../components/form";
import { type ReservationFormValueT } from "../schemas";
import { filterEmptyString } from "../helpers";
import { StyledCheckboxWrapper, StyledTextArea, StyledTextInput } from "./styled";
import {
  constructReservationFieldId,
  constructReservationFieldLabel,
  convertOptionsToField,
  type ExtendedReserveeType,
  type FieldOptions,
  translateReserveeFormError,
  RESERVATION_FIELD_MAX_TEXT_LENGTH,
} from "./util";

type Props = {
  field: keyof ReservationFormValueT;
  options: OptionsRecord;
  translationKey?: ExtendedReserveeType;
};

export function ReservationFormField({ field, options: originalOptions, translationKey }: Props) {
  const { t } = useTranslation();
  const options = convertOptionsToField(originalOptions);

  const {
    watch,
    register,
    control,
    formState: { errors },
  } = useFormContext<ReservationFormValueT>();

  const label = constructReservationFieldLabel(t, translationKey, field);
  const errorText = translateReserveeFormError(t, label, errors[`${field}`]);

  const id = constructReservationFieldId(field);

  const isSelectField = Object.keys(options).includes(field);

  if (isSelectField) {
    const optionsNarrowed = Object.keys(options).includes(field) ? options[field as keyof FieldOptions] : [];
    return (
      <ControlledSelect
        id={id}
        name={field}
        label={label}
        control={control}
        required
        options={optionsNarrowed}
        error={filterEmptyString(errorText)}
        style={{
          gridColumn: field === "purpose" ? "1 / -1" : undefined,
        }}
        strongLabel
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
    // TODO remove
    case "applyingForFreeOfCharge":
      return null;
    case "reserveeIsUnregisteredAssociation":
      if (watch("reserveeType") !== ReserveeType.Nonprofit) {
        return null;
      }
      return (
        <StyledCheckboxWrapper key={field}>
          <ControlledCheckbox {...checkParams} />
        </StyledCheckboxWrapper>
      );
    // TODO remove
    case "freeOfChargeReason":
      return null;
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
          maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
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
          maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
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
      maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
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
      maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH - (isEmailField ? 1 : 0)}
    />
  );
}
