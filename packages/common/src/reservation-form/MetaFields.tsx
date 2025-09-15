import React, { Fragment } from "react";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { type MetadataSetsFragment, type ReservationUnitNode, ReserveeType } from "../../gql/gql-types";
import { ReservationFormField } from "./ReservationFormField";
import { ReservationSubventionSection } from "./ReservationSubventionSection";
import { AutoGrid, H4, H5 } from "../../styled";
import { type OptionsRecord } from "../../types/common";
import {
  constructReservationFieldId,
  constructReservationFieldLabel,
  type ExtendedFormFieldArray,
  extendMetaFieldOptions,
  formContainsField,
  RESERVATION_FIELD_MAX_TEXT_LENGTH,
  translateReserveeFormError,
} from "./util";
import { CustomerTypeSelector } from "./CustomerTypeSelector";
import { type ReservationFormValueT } from "../schemas";
import { ControlledNumberInput, ControlledSelect } from "../components/form";
import { StyledTextArea, StyledTextInput } from "./styled";

interface CommonWithFields {
  fields: ExtendedFormFieldArray;
  options: Readonly<Omit<OptionsRecord, "municipalities">>;
}

interface ReservationFormGeneralSectionProps extends CommonWithFields {
  reservationUnit: MetadataSetsFragment;
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
  reservationUnit: Pick<ReservationUnitNode, "reservationForm">;
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

// TODO this is used in a silly way, it should be before we iterate over the form fields
// the heading label should be picked based on possible fields and selected type, not position etc.
// so
// Individual -> no subheadings
// Organisation -> two subheadings
// - one for organisation info
// - one for contact info
function SubheadingByType({
  reserveeType,
  index,
  field,
}: {
  reserveeType: ReserveeType;
  index: number;
  field: string;
}): React.ReactElement | null {
  const { t } = useTranslation();

  if (reserveeType === ReserveeType.Individual) {
    return null;
  }

  if (reserveeType === ReserveeType.Nonprofit) {
    const headingForNonProfit = index === 0;

    if (headingForNonProfit) {
      return <GroupHeading>{t("reservationApplication:label.headings.nonprofitInfo")}</GroupHeading>;
    }
  }
  if (reserveeType === ReserveeType.Company) {
    const headingForCompanyInfo = index === 0;

    if (headingForCompanyInfo) {
      return <GroupHeading>{t("reservationApplication:label.headings.companyInfo")}</GroupHeading>;
    }
  }

  // TODO in what case does the above checks fall to here?
  if (field === "reserveeFirstName") {
    return <GroupHeading>{t("reservationApplication:label.headings.contactInfo")}</GroupHeading>;
  }
  return null;
}

export function ReservationFormGeneralSection({
  fields,
  options: originalOptions,
  data,
}: ReservationFormGeneralSectionProps) {
  const { t } = useTranslation();
  const form = useFormContext<ReservationFormValueT>();
  const {
    control,
    register,
    formState: { errors },
  } = form;

  if (fields.length === 0) {
    return null;
  }

  const createLabel = (field: keyof ReservationFormValueT): string => {
    return constructReservationFieldLabel(t, "COMMON", field);
  };

  const getFieldError = (field: keyof ReservationFormValueT): string | undefined => {
    return translateReserveeFormError(t, createLabel(field), errors[field]);
  };

  const options = extendMetaFieldOptions(originalOptions, t);

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
          id={constructReservationFieldId("purpose")}
          label={createLabel("name")}
          {...register("name")}
          type="text"
          errorText={getFieldError("name")}
          invalid={getFieldError("name") != null}
          required
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
          options={options.reservationPurposes}
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
          min={1} //minValue}
          // max={maxValue}
        />
      )}
      {hasAgeGroup && (
        <ControlledSelect
          id={constructReservationFieldId("ageGroup")}
          name="ageGroup"
          label={createLabel("ageGroup")}
          control={control}
          required
          options={options.ageGroups}
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

// TODO reduce prop drilling / remove unused props
export function ReservationFormReserveeSection({
  fields,
  reservationUnit,
  options,
  style,
  className,
}: ReservationFormReserveeSectionProps) {
  const {
    watch,
    control,
    formState: { errors },
  } = useFormContext<ReservationFormValueT>();
  const { t } = useTranslation();

  const isTypeSelectable = formContainsField(reservationUnit.reservationForm, "reserveeType");

  const reserveeType = watch("reserveeType");

  const errorTrKey = errors.reserveeType?.message ? `forms:${errors.reserveeType.message}` : undefined;
  const error = errorTrKey ? t(errorTrKey, { fieldName: t("reservationApplication:reserveeType") }) : undefined;

  return (
    <AutoGrid data-testid="reservation__form--reservee-info" className={className} style={style}>
      <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
      {isTypeSelectable && <CustomerTypeSelector name="reserveeType" control={control} required error={error} />}
      {fields.map((field, index) => (
        <Fragment key={`key-${field}-container`}>
          {reserveeType != null && (
            // TODO the logic inside this component is really weird
            // move the logic here instead (or properly refactor)
            <SubheadingByType reserveeType={reserveeType} index={index} field={field} key={`key-${field}-subheading`} />
          )}
          <ReservationFormField
            key={`key-${field}`}
            field={field}
            options={extendMetaFieldOptions(options, t)}
            reserveeType={reserveeType}
          />
        </Fragment>
      ))}
    </AutoGrid>
  );
}
