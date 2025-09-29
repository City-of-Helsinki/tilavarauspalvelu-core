import React, { Fragment } from "react";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import { MunicipalityChoice, type ReservationUnitNode, ReserveeType } from "../../gql/gql-types";
import { ReservationFormField } from "./ReservationFormField";
import { AutoGrid, H4, H5 } from "../styled";
import type { OptionsRecord } from "../../types/common";
import { ReservationSubventionSection } from "./ReservationSubventionSection";
import {
  constructReservationFieldId,
  constructReservationFieldLabel,
  formContainsField,
  RESERVATION_FIELD_MAX_TEXT_LENGTH,
  translateReserveeFormError,
  getReservationFormFields,
  getFilteredGeneralFields,
} from "./util";
import { CustomerTypeSelector } from "./CustomerTypeSelector";
import { type ReservationFormValueT } from "../schemas";
import { ControlledCheckbox, ControlledNumberInput, ControlledSelect } from "../components/form";
import { StyledCheckboxWrapper, StyledTextArea, StyledTextInput } from "./styled";

interface CommonWithFields {
  reservationUnit: Pick<ReservationUnitNode, "reservationForm" | "minPersons" | "maxPersons">;
}

interface ReservationFormGeneralSectionProps extends CommonWithFields {
  options: Readonly<OptionsRecord>;
  data?:
    | {
        enableSubvention: false;
      }
    | {
        termsForDiscount: JSX.Element | string;
        enableSubvention: true;
      };
}

interface ReservationFormReserveeSectionProps extends CommonWithFields {
  style?: React.CSSProperties;
  className?: string;
}

const GroupHeading = styled(H5)`
  grid-column: 1 / -1;
  margin-bottom: 0;
  margin-top: 0;
`;

const Subheading = styled(H4).attrs({ as: "h2" })`
  grid-column: 1 / -1;
  margin: 0;
`;

export function ReservationFormGeneralSection({ reservationUnit, options, data }: ReservationFormGeneralSectionProps) {
  const { t } = useTranslation();
  const form = useFormContext<ReservationFormValueT>();
  const {
    control,
    register,
    formState: { errors },
  } = form;

  const fields = getFilteredGeneralFields(reservationUnit.reservationForm);

  if (fields.length === 0) {
    return null;
  }

  const createLabel = (field: keyof ReservationFormValueT): string => {
    return constructReservationFieldLabel(t, "COMMON", field);
  };

  const getFieldError = (field: keyof ReservationFormValueT): string | undefined => {
    return translateReserveeFormError(t, createLabel(field), errors[field], {
      minValue: reservationUnit.minPersons,
      maxValue: reservationUnit.maxPersons,
    });
  };

  const hasPurpose = fields.find((x) => x === "purpose") != null;
  const hasAgeGroup = fields.find((x) => x === "ageGroup") != null;
  const hasName = fields.find((x) => x === "name") != null;
  const hasDescription = fields.find((x) => x === "description") != null;
  const hasNumPersons = fields.find((x) => x === "numPersons") != null;

  return (
    <AutoGrid>
      <Subheading>{t("reservationCalendar:reservationInfo")}</Subheading>
      {hasName && (
        <StyledTextInput
          id={constructReservationFieldId("name")}
          label={createLabel("name")}
          {...register("name")}
          type="text"
          errorText={getFieldError("name")}
          invalid={getFieldError("name") != null}
          maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
          $isWide
        />
      )}
      {hasPurpose && (
        <ControlledSelect
          id={constructReservationFieldId("purpose")}
          name="purpose"
          label={createLabel("purpose")}
          control={control}
          required
          options={options.purpose}
          error={getFieldError("purpose")}
          style={{ gridColumn: "1 / -1" }}
          strongLabel
        />
      )}
      {hasNumPersons && (
        <ControlledNumberInput<ReservationFormValueT>
          name="numPersons"
          control={control}
          label={createLabel("numPersons")}
          errorText={getFieldError("numPersons")}
          required
          min={1}
        />
      )}
      {hasAgeGroup && (
        <ControlledSelect
          id={constructReservationFieldId("ageGroup")}
          name="ageGroup"
          label={createLabel("ageGroup")}
          control={control}
          required
          options={options.ageGroup}
          error={getFieldError("ageGroup")}
          strongLabel
        />
      )}
      {hasDescription && (
        <StyledTextArea
          id={constructReservationFieldId("description")}
          label={createLabel("description")}
          {...register("description")}
          errorText={getFieldError("description")}
          invalid={getFieldError("description") != null}
          required
          maxLength={RESERVATION_FIELD_MAX_TEXT_LENGTH}
          $isWide
          $height="119px"
        />
      )}
      {data?.enableSubvention && <ReservationSubventionSection termsForDiscount={data.termsForDiscount} form={form} />}
    </AutoGrid>
  );
}

export function ReservationFormReserveeSection({
  reservationUnit,
  style,
  className,
}: ReservationFormReserveeSectionProps) {
  const form = useFormContext<ReservationFormValueT>();
  const {
    watch,
    control,
    formState: { errors },
  } = form;
  const { t } = useTranslation();

  const isTypeSelectable = formContainsField(reservationUnit.reservationForm, "reserveeType");

  const reserveeType = watch("reserveeType");

  const reserveeTypeErrorTr = errors.reserveeType?.message ? `forms:${errors.reserveeType.message}` : undefined;
  const reserveeTypeError = reserveeTypeErrorTr
    ? t(reserveeTypeErrorTr, { fieldName: t("reservationApplication:reserveeType") })
    : undefined;

  const createLabel = (field: keyof ReservationFormValueT): string => {
    return constructReservationFieldLabel(t, reserveeType, field);
  };

  const getFieldError = (field: keyof ReservationFormValueT): string | undefined => {
    return translateReserveeFormError(t, createLabel(field), errors[field]);
  };

  const municipalityOptions = Object.values(MunicipalityChoice).map((value) => ({
    label: t(`common:municipalities.${value.toUpperCase()}`),
    value: value,
  }));

  const fields = getReservationFormFields({
    formType: reservationUnit.reservationForm,
    reserveeType,
  });
  const organisationOnlySet = new Set(["reserveeIdentifier", "reserveeOrganisationName"]);
  const organisationFields = fields.filter((x) => organisationOnlySet.has(x));
  const otherFields = fields.filter((x) => !organisationOnlySet.has(x));

  return (
    <AutoGrid data-testid="reservation__form--reservee-info" className={className} style={style}>
      <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
      {isTypeSelectable && (
        <CustomerTypeSelector name="reserveeType" control={control} required error={reserveeTypeError} />
      )}
      {reserveeType === ReserveeType.Nonprofit ? (
        <GroupHeading>{t("reservationApplication:label.headings.nonprofitInfo")}</GroupHeading>
      ) : reserveeType === ReserveeType.Company ? (
        <GroupHeading>{t("reservationApplication:label.headings.companyInfo")}</GroupHeading>
      ) : null}
      {/* TODO propably best to separate the organisation part of the form to it's own section */}
      {reserveeType != null && reserveeType !== ReserveeType.Individual ? (
        <>
          <ControlledSelect
            name="municipality"
            id={constructReservationFieldId("municipality")}
            label={createLabel("municipality")}
            error={getFieldError("municipality")}
            control={control}
            required
            options={municipalityOptions}
            strongLabel
          />
          {organisationFields.map((field) => (
            <Fragment key={`key-${field}-container`}>
              <ReservationFormField field={field} reserveeType={reserveeType} form={form} />
            </Fragment>
          ))}
          {reserveeType === ReserveeType.Nonprofit && (
            <StyledCheckboxWrapper>
              <ControlledCheckbox
                name="reserveeIsUnregisteredAssociation"
                id={constructReservationFieldId("reserveeIsUnregisteredAssociation")}
                control={control}
                label={createLabel("reserveeIsUnregisteredAssociation")}
                error={getFieldError("reserveeIsUnregisteredAssociation")}
              />
            </StyledCheckboxWrapper>
          )}
          <GroupHeading>{t("reservationApplication:label.headings.contactInfo")}</GroupHeading>
        </>
      ) : null}
      {otherFields.map((field) => (
        <Fragment key={`key-${field}-container`}>
          <ReservationFormField field={field} reserveeType={reserveeType} form={form} />
        </Fragment>
      ))}
      {otherFields.find((x) => x === "municipality") != null &&
        reserveeType !== ReserveeType.Company &&
        reserveeType !== ReserveeType.Nonprofit && (
          <ControlledSelect
            name="municipality"
            id={constructReservationFieldId("municipality")}
            label={createLabel("municipality")}
            error={getFieldError("municipality")}
            control={control}
            required
            options={municipalityOptions}
            strongLabel
          />
        )}
    </AutoGrid>
  );
}

export const RESERVATION_META_FIELDS_FRAGMENT = gql`
  fragment ReservationFormFields on ReservationNode {
    id
    reserveeFirstName
    reserveeLastName
    reserveeEmail
    reserveePhone
    reserveeType
    reserveeOrganisationName
    reserveeIdentifier
    ageGroup {
      id
      pk
      maximum
      minimum
    }
    purpose {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    municipality
    numPersons
    name
    description
    freeOfChargeReason
    applyingForFreeOfCharge
    reservationUnit {
      reservationForm
    }
  }
`;
