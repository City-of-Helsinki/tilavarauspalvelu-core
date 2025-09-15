import React, { Fragment } from "react";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { type MetadataSetsFragment, type ReservationUnitNode, ReserveeType } from "../../gql/gql-types";
import { ReservationFormField } from "./ReservationFormField";
import { AutoGrid, H4, H5 } from "../../styled";
import { type OptionsRecord } from "../../types/common";
import { type ExtendedFormFieldArray, extendMetaFieldOptions, formContainsField } from "./util";
import { CustomerTypeSelector } from "./CustomerTypeSelector";
import { type ReservationFormValueT } from "../schemas";

interface CommonProps {
  options: Readonly<Omit<OptionsRecord, "municipalities">>;
}

interface CommonWithFields extends CommonProps {
  fields: ExtendedFormFieldArray;
}

interface ReservationFormFieldsProps extends CommonWithFields {
  headingKey?: ReserveeType | "COMMON";
  hasSubheading?: boolean;
  params?: { numPersons: { min?: number; max?: number } };
  data?: {
    termsForDiscount?: JSX.Element | string;
    enableSubvention?: boolean;
  };
}

interface ReservationFormGeneralSectionProps extends CommonWithFields {
  reservationUnit: MetadataSetsFragment;
  data?: {
    termsForDiscount?: JSX.Element | string;
    enableSubvention?: boolean;
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

function ReservationFormFields({
  fields,
  options,
  // subheading is needed because application form uses it and requires index / field data to render it
  headingKey,
  hasSubheading,
  data,
}: ReservationFormFieldsProps) {
  const { t } = useTranslation();

  // TODO the subheading logic is weird / inefficient
  // instead of adding it to sections (or dividing the fields array into sections with headings)
  // we check for index === 0 inside a loop invariant
  return (
    <>
      {fields.map((field, index) => (
        <Fragment key={`key-${field}-container`}>
          {hasSubheading && headingKey != null && headingKey !== "COMMON" && (
            <SubheadingByType reserveeType={headingKey} index={index} field={field} key={`key-${field}-subheading`} />
          )}
          <ReservationFormField
            key={`key-${field}`}
            field={field}
            options={extendMetaFieldOptions(options, t)}
            translationKey={headingKey}
            data={data}
          />
        </Fragment>
      ))}
    </>
  );
}

// TODO reduce prop drilling / remove unused props
export function ReservationFormGeneralSection({ fields, options, data }: ReservationFormGeneralSectionProps) {
  const { t } = useTranslation();

  if (fields.length === 0) {
    return null;
  }

  const fieldsExtended = [...fields];

  if (data?.enableSubvention) {
    fieldsExtended.push("applyingForFreeOfCharge", "freeOfChargeReason");
  }
  return (
    <AutoGrid>
      <Subheading>{t("reservationCalendar:reservationInfo")}</Subheading>
      <ReservationFormFields
        options={extendMetaFieldOptions(options, t)}
        fields={fieldsExtended}
        headingKey="COMMON"
        data={data}
      />
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
      <ReservationFormFields
        fields={fields}
        options={extendMetaFieldOptions(options, t)}
        hasSubheading
        headingKey={reserveeType}
      />
    </AutoGrid>
  );
}
