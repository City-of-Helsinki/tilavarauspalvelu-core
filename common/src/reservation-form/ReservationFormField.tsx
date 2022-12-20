import { Checkbox, NumberInput, Select, TextArea, TextInput } from "hds-react";
import camelCase from "lodash/camelCase";
import get from "lodash/get";
import React, { ReactElement, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { TFunction } from "react-i18next";
import styled from "styled-components";
import { fontMedium, fontRegular, Strongish } from "../common/typography";
import { ReservationMetadataSetType } from "../../types/gql-types";
import { Inputs, Reservation } from "./types";
import { CheckboxWrapper } from "./components";
import { OptionType } from "../../types/common";

type Props = {
  field: keyof Inputs;
  options: Record<string, OptionType[]>;
  reserveeType: string;
  reservation: Reservation;
  metadataSet: ReservationMetadataSetType;
  form: ReturnType<typeof useForm>;
  params?: Record<string, Record<string, string | number>>;
  data?: Record<string, ReactElement>;
  t: TFunction;
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

const ReservationFormField = ({
  field,
  options,
  reserveeType,
  metadataSet,
  reservation,
  form: {
    register,
    control,
    watch,
    formState: { errors },
  },
  params = {},
  data = {},
  t,
}: Props): JSX.Element => {
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

  const required = ((metadataSet.requiredFields || []) as string[])
    .map(camelCase)
    .includes(field);

  const isReserveeIdRequired =
    field === "reserveeId" &&
    watch("reserveeIsUnregisteredAssociation") !== undefined
      ? watch("reserveeIsUnregisteredAssociation") !== true
      : required;

  const isFreeOfChargeReasonRequired =
    field === "freeOfChargeReason" && watch("applyingForFreeOfCharge") === true;

  return Object.keys(options).includes(field) ? (
    <Controller
      name={field}
      control={control}
      key={field}
      rules={{ required }}
      render={({ field: formField }) => (
        <StyledSelect
          label={t(
            `reservationApplication:label.${normalizedReserveeType}.${field}`
          )}
          id={field}
          options={options[field]}
          defaultValue={options[field].find(
            (n) => n.value === get(reservation, field)
          )}
          {...formField}
          value={formField.value || null}
          error={get(errors, field) && t("forms:requiredField")}
          required={required}
          invalid={!!get(errors, field)}
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
      <Controller
        name={field}
        control={control}
        defaultValue={get(reservation, field)}
        rules={{ required }}
        render={({ field: formField }) => (
          <StyledCheckbox
            id={field}
            onChange={(e) => formField.onChange(e.target.checked)}
            checked={formField.value}
            label={
              <>
                {data?.subventionLabel ||
                  t(
                    `reservationApplication:label.${normalizedReserveeType}.${field}`
                  )}
                {required ? " * " : ""}
              </>
            }
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
        render={({ field: formField }) => (
          <Checkbox
            id={field}
            onChange={(e) => formField.onChange(e.target.checked)}
            checked={formField.value}
            defaultChecked={watch("reserveeIsUnregisteredAssociation")}
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
        render={({ field: formField }) => (
          <Checkbox
            id={field}
            onChange={(e) => formField.onChange(e.target.checked)}
            checked={formField.value}
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
      )}${isFreeOfChargeReasonRequired ? " * " : ""}`}
      id={field}
      key={field}
      {...register(field, { required: isFreeOfChargeReasonRequired })}
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
      {...register(field, {
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
      {...register(field, {
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
  ) : field === "reserveeId" ? (
    <StyledTextInput
      label={`${t(
        `reservationApplication:label.${normalizedReserveeType}.${field}`
      )}${isReserveeIdRequired ? " * " : ""}`}
      id={field}
      {...register(field, {
        required: isReserveeIdRequired,
      })}
      key={field}
      type="text"
      defaultValue={get(reservation, field)}
      errorText={get(errors, field) && t("forms:requiredField")}
      invalid={!!get(errors, field)}
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
      label={`${t(
        `reservationApplication:label.${normalizedReserveeType}.${field}`
      )}${required ? " * " : ""}`}
      id={field}
      {...register(field, {
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
