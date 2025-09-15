import React from "react";
import { useFormContext, type UseFormRegister } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ReserveeType } from "../../gql/gql-types";
import { type OptionsRecord } from "../../types/common";
import { ControlledCheckbox, ControlledSelect } from "../components/form";
import { type ReservationFormValueT } from "../schemas";
import { filterEmptyString } from "../helpers";
import { StyledCheckboxWrapper, StyledTextInput } from "./styled";
import {
  constructReservationFieldId,
  constructReservationFieldLabel,
  translateReserveeFormError,
  RESERVATION_FIELD_MAX_TEXT_LENGTH,
} from "./util";

type Props = {
  field: keyof ReservationFormValueT;
  options: OptionsRecord;
  reserveeType?: ReserveeType;
};

export function ReservationFormField({
  field,
  options: originalOptions,
  reserveeType,
}: Props): React.ReactElement | null {
  const { t } = useTranslation();

  const {
    watch,
    register,
    control,
    formState: { errors },
  } = useFormContext<ReservationFormValueT>();

  const label = constructReservationFieldLabel(t, reserveeType, field);
  const errorText = filterEmptyString(translateReserveeFormError(t, label, errors[`${field}`]));
  const id = constructReservationFieldId(field);

  switch (field) {
    case "municipality": {
      return (
        <ControlledSelect
          id={id}
          name={field}
          label={label}
          control={control}
          required
          options={originalOptions.municipalities}
          error={errorText}
          strongLabel
          key={field}
        />
      );
    }
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
      return null;
    }
    case "description":
      return null;
    // TODO remove
    case "applyingForFreeOfCharge":
      return null;
    // TODO remove
    case "freeOfChargeReason":
      return null;
    case "reserveeIsUnregisteredAssociation":
      if (watch("reserveeType") !== ReserveeType.Nonprofit) {
        return null;
      }
      return (
        <StyledCheckboxWrapper key={field}>
          <ControlledCheckbox id={id} name={field} control={control} label={label} error={errorText} />
        </StyledCheckboxWrapper>
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
          invalid={errorText != null}
          required={!shouldHideOrganisationIdentifier}
          maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
          disabled={shouldHideOrganisationIdentifier}
        />
      );
    }
    case "reserveeEmail":
      return <EmailInput label={label} field={field} register={register} errorText={errorText} id={id} />;
    case "name":
      return null;
    case "ageGroup":
      return null;
    case "purpose":
      return null;
    case "pk":
      return null;
    case "reserveeType":
      return null;
    case "reserveePhone":
    case "reserveeLastName":
    case "reserveeFirstName":
    case "reserveeOrganisationName": {
      return (
        <StyledTextInput
          label={label}
          id={id}
          {...register(field)}
          key={field}
          type="text"
          errorText={errorText}
          invalid={errorText != null}
          required
          maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
        />
      );
    }
  }
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
      errorText={errorText}
      invalid={errorText != null}
      required
      // email field is special and has one less character than the rest
      maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH - (isEmailField ? 1 : 0)}
    />
  );
}
