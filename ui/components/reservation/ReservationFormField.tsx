import { OptionType } from "common/types/common";
import { Checkbox, NumberInput, Select, TextArea, TextInput } from "hds-react";
import camelCase from "lodash/camelCase";
import get from "lodash/get";
import React, { useMemo } from "react";
import { Control, Controller, DeepMap, FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { fontMedium } from "common/src/common/typography";
import { ReservationMetadataSetType } from "../../modules/gql-types";
import { Inputs, Reservation } from "../../modules/types";
import { CheckboxWrapper } from "../common/common";

type Props = {
  field: string;
  options: Record<string, OptionType[]>;
  reserveeType: string;
  reservation: Reservation;
  metadataSet: ReservationMetadataSetType;
  errors: DeepMap<Inputs, FieldError>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any;
  params?: Record<string, Record<string, string | number>>;
};

const StyledCheckboxWrapper = styled(CheckboxWrapper)<{ $break?: boolean }>`
  ${({ $break }) => $break && "margin-top: 0"}
`;

type TextAreaProps = {
  $isWide?: boolean;
  $hidden?: boolean;
  $break?: boolean;
  $height?: string;
};

const StyledTextArea = styled(TextArea).attrs(({ $height }: TextAreaProps) => ({
  style: { "--textarea-height": $height },
}))<TextAreaProps>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};
  ${({ $break }) => $break && "grid-column: 1 / -2"};

  label {
    ${fontMedium};
  }
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

const ReservationFormField = ({
  field,
  options,
  reserveeType,
  metadataSet,
  reservation,
  errors,
  control,
  register,
  watch,
  params = {},
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const normalizedReserveeType = reserveeType.toLocaleLowerCase();

  const isWideRow = useMemo(
    (): boolean =>
      [
        "name",
        "description",
        "reserveeAddressStreet",
        // "reserveeOrganisationName",
        "billingAddressStreet",
      ].includes(field),
    [field]
  );

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

  const required = metadataSet.requiredFields.map(camelCase).includes(field);

  return Object.keys(options).includes(field) ? (
    <Controller
      as={
        <Select
          label={t(
            `reservationApplication:label.${normalizedReserveeType}.${field}`
          )}
          id={field}
          options={options[field]}
          defaultValue={options[field].find(
            (n) => n.value === get(reservation, field)
          )}
          error={get(errors, field) && t("forms:requiredField")}
          required={required}
          invalid={!!get(errors, field)}
        />
      }
      name={field}
      control={control}
      key={field}
      rules={{ required }}
    />
  ) : field === "applyingForFreeOfCharge" ? (
    <StyledCheckboxWrapper key={field} $break={isBreakingColumn}>
      <Controller
        name={field}
        control={control}
        defaultValue={get(reservation, field)}
        rules={{ required }}
        render={(props) => (
          <Checkbox
            id={field}
            onChange={(e) => props.onChange(e.target.checked)}
            checked={props.value}
            label={`${t(
              `reservationApplication:label.${normalizedReserveeType}.${field}`
            )}${required ? " * " : ""}`}
            errorText={get(errors, field) && t("forms:requiredField")}
          />
        )}
      />
    </StyledCheckboxWrapper>
  ) : field === "reserveeIsUnregisteredAssociation" ? (
    <StyledCheckboxWrapper key={field} $break={isBreakingColumn}>
      <Controller
        name={field}
        control={control}
        defaultValue={get(reservation, field)}
        rules={{ required }}
        render={(props) => (
          <Checkbox
            id={field}
            onChange={(e) => props.onChange(e.target.checked)}
            checked={props.value}
            defaultChecked={get(reservation, field)}
            label={`${t(
              `reservationApplication:label.${normalizedReserveeType}.${field}`
            )}${required ? " * " : ""}`}
            errorText={get(errors, field) && t("forms:requiredField")}
          />
        )}
      />
    </StyledCheckboxWrapper>
  ) : field === "showBillingAddress" ? (
    <StyledCheckboxWrapper key={field} $break={isBreakingColumn}>
      <Controller
        name={field}
        control={control}
        defaultValue={get(reservation, field)}
        rules={{ required }}
        render={(props) => (
          <Checkbox
            id={field}
            onChange={(e) => props.onChange(e.target.checked)}
            checked={props.value}
            defaultChecked={get(reservation, field)}
            label={`${t(
              `reservationApplication:label.${normalizedReserveeType}.${field}`
            )}${required ? " * " : ""}`}
            errorText={get(errors, field) && t("forms:requiredField")}
          />
        )}
      />
    </StyledCheckboxWrapper>
  ) : field === "freeOfChargeReason" ? (
    <StyledTextArea
      label={`${t(
        `reservationApplication:label.${normalizedReserveeType}.${field}`
      )}${required ? " * " : ""}`}
      id={field}
      name={field}
      ref={register({ required })}
      key={field}
      defaultValue={get(reservation, field) || ""}
      errorText={get(errors, field) && t("forms:requiredField")}
      invalid={!!get(errors, field)}
      $hidden={!watch("applyingForFreeOfCharge")}
      $isWide
      $height="92px"
    />
  ) : isNumField ? (
    <NumberInput
      label={`${t(
        `reservationApplication:label.${normalizedReserveeType}.${field}`
      )}${required ? " * " : ""}`}
      id={field}
      name={field}
      ref={register({
        required,
        ...(required && {
          min: 1,
        }),
      })}
      key={field}
      defaultValue={get(reservation, field) as number}
      errorText={get(errors, field) && t("forms:requiredField")}
      invalid={!!get(errors, field)}
      step={1}
      minusStepButtonAriaLabel={t("common:decrease")}
      plusStepButtonAriaLabel={t("common:increase")}
      min={get(params, field)?.min as number}
      max={get(params, field)?.max as number}
    />
  ) : isTextArea ? (
    <StyledTextArea
      label={`${t(
        `reservationApplication:label.${normalizedReserveeType}.${field}`
      )}${required ? " * " : ""}`}
      id={field}
      name={field}
      ref={register({
        required,
        ...(isEmailField && {
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "email",
          },
        }),
      })}
      key={field}
      defaultValue={get(reservation, field)}
      errorText={
        get(errors, field) &&
        t(
          `forms:${
            get(errors, field)?.message === "email"
              ? "invalidEmail"
              : "requiredField"
          }`
        )
      }
      invalid={!!get(errors, field)}
      $isWide={isWideRow}
      $hidden={
        field.includes("billing") && watch("showBillingAddress") !== true
      }
      $break={isBreakingColumn}
      $height="119px"
    />
  ) : (
    <StyledTextInput
      label={`${t(
        `reservationApplication:label.${normalizedReserveeType}.${field}`
      )}${required ? " * " : ""}`}
      id={field}
      name={field}
      ref={register({
        required,
        ...(isEmailField && {
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "email",
          },
        }),
      })}
      key={field}
      type="text"
      defaultValue={get(reservation, field)}
      errorText={
        get(errors, field) &&
        t(
          `forms:${
            get(errors, field)?.message === "email"
              ? "invalidEmail"
              : "requiredField"
          }`
        )
      }
      invalid={!!get(errors, field)}
      $isWide={isWideRow}
      $hidden={
        field.includes("billing") && watch("showBillingAddress") !== true
      }
      $break={isBreakingColumn}
    />
  );
};

export default ReservationFormField;
