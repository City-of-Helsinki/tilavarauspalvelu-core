import React from "react";
import { useFormContext, type UseFormRegister } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { ReserveeType } from "../../gql/gql-types";
import { type ReservationFormValueT } from "../schemas";
import { StyledTextInput } from "./styled";
import {
  constructReservationFieldId,
  constructReservationFieldLabel,
  translateReserveeFormError,
  RESERVATION_FIELD_MAX_TEXT_LENGTH,
} from "./util";

type Props = {
  field: keyof ReservationFormValueT;
  reserveeType?: ReserveeType;
};

// TODO turn this into TextFields only now?
export function ReservationFormField({ field, reserveeType }: Props): React.ReactElement | null {
  const { t } = useTranslation();

  const {
    watch,
    register,
    formState: { errors },
  } = useFormContext<ReservationFormValueT>();

  const label = constructReservationFieldLabel(t, reserveeType, field);
  const errorText = translateReserveeFormError(t, label, errors[`${field}`]);

  switch (field) {
    case "reserveeIdentifier": {
      const disabled =
        watch("reserveeType") === ReserveeType.Nonprofit && watch("reserveeIsUnregisteredAssociation") === true;

      return (
        <ReservationTextInput
          label={label}
          name={field}
          register={register}
          errorText={errorText}
          disabled={disabled}
        />
      );
    }
    case "reserveeIsUnregisteredAssociation":
    case "municipality":
    case "numPersons":
    case "description":
    case "applyingForFreeOfCharge":
    case "freeOfChargeReason":
    case "name":
    case "ageGroup":
    case "purpose":
    case "pk":
    case "reserveeType":
      return null;
    case "reserveeEmail":
      return <ReservationTextInput label={label} name={field} register={register} errorText={errorText} isEmail />;
    case "reserveePhone":
    case "reserveeLastName":
    case "reserveeFirstName":
    case "reserveeOrganisationName": {
      return <ReservationTextInput label={label} name={field} register={register} errorText={errorText} />;
    }
  }
}

function ReservationTextInput({
  label,
  name,
  register,
  errorText,
  isEmail,
  disabled,
}: {
  label: string;
  name: keyof ReservationFormValueT;
  register: UseFormRegister<ReservationFormValueT>;
  errorText?: string;
  isEmail?: boolean;
  disabled?: boolean;
}): React.ReactElement {
  const id = constructReservationFieldId(name);
  return (
    <StyledTextInput
      label={label}
      id={id}
      {...register(name)}
      type="text"
      errorText={errorText}
      invalid={errorText != null}
      required={!disabled}
      disabled={disabled}
      // email field is special and has one less character than the rest
      maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH - (isEmail ? 1 : 0)}
    />
  );
}
