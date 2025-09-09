import React, { Fragment } from "react";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { gql } from "@apollo/client";
import {
  type MetadataSetsFragment,
  ReservationFormType,
  type ReservationUnitNode,
  ReserveeType,
} from "../../gql/gql-types";
import { ReservationFormField } from "./ReservationFormField";
import { type ReservationFormT } from "./types";
import { AutoGrid, H4, H5 } from "../styled";
import type { OptionsRecord } from "../../types/common";
import { type ExtendedFormFieldArray, extendMetaFieldOptions, formContainsField } from "./util";
import { CustomerTypeSelector } from "./CustomerTypeSelector";

interface CommonProps {
  options: Readonly<Omit<OptionsRecord, "municipality">>;
  data?: {
    termsForDiscount?: JSX.Element | string;
    enableSubvention?: boolean;
  };
}

interface CommonWithFields extends CommonProps {
  fields: ExtendedFormFieldArray;
}

interface ReservationFormFieldsProps extends CommonWithFields {
  headingKey?: ReserveeType | "COMMON";
  hasSubheading?: boolean;
  params?: { numPersons: { min?: number; max?: number } };
  formType: ReservationFormType;
  section: "general" | "reservee";
}

interface ReservationFormGeneralSectionProps extends CommonWithFields {
  reservationUnit: MetadataSetsFragment;
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
  params,
  data,
  section,
  // TODO need to add usage for this to get required field (unless we hard code it in the Form itself?)
  formType: _,
}: ReservationFormFieldsProps) {
  const { t } = useTranslation();

  const fieldsExtended = fields.map((field) => ({
    field,
    // TODO should have a separate function to check against formType
    // there are very few fields that are required and some have interlinks
    // required here only matters for the label rendering (we should check against a schema for validation)
    required: true,
  }));

  if (section === "general" && data?.enableSubvention) {
    fieldsExtended.push(
      {
        field: "applyingForFreeOfCharge",
        required: false,
      },
      {
        field: "freeOfChargeReason",
        required: true,
      }
    );
  }

  // TODO the subheading logic is weird / inefficient
  // instead of adding it to sections (or dividing the fields array into sections with headings)
  // we check for index === 0 inside a loop invariant
  return (
    <>
      {fieldsExtended.map(({ field, required }, index) => (
        <Fragment key={`key-${field}-container`}>
          {hasSubheading && headingKey != null && headingKey !== "COMMON" && (
            <SubheadingByType reserveeType={headingKey} index={index} field={field} key={`key-${field}-subheading`} />
          )}
          <ReservationFormField
            key={`key-${field}`}
            field={field}
            options={extendMetaFieldOptions(options, t)}
            required={required}
            translationKey={headingKey}
            params={params}
            data={data}
          />
        </Fragment>
      ))}
    </>
  );
}

// TODO reduce prop drilling / remove unused props
export function ReservationFormGeneralSection({
  fields,
  reservationUnit,
  options,
  data,
}: ReservationFormGeneralSectionProps) {
  const { t } = useTranslation();

  if (fields.length === 0) {
    return null;
  }
  return (
    <AutoGrid>
      <Subheading>{t("reservationCalendar:reservationInfo")}</Subheading>
      <ReservationFormFields
        options={extendMetaFieldOptions(options, t)}
        fields={fields}
        formType={reservationUnit.reservationForm}
        headingKey="COMMON"
        section="general"
        params={{
          numPersons: {
            min: !reservationUnit.minPersons || reservationUnit.minPersons === 0 ? 1 : reservationUnit.minPersons,
            max:
              reservationUnit.maxPersons != null &&
              !Number.isNaN(reservationUnit.maxPersons) &&
              reservationUnit.maxPersons > 0
                ? reservationUnit.maxPersons
                : undefined,
          },
        }}
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
  data,
  style,
  className,
}: ReservationFormReserveeSectionProps) {
  const { watch } = useFormContext<ReservationFormT>();
  const { t } = useTranslation();

  const isTypeSelectable = formContainsField(reservationUnit.reservationForm, "reserveeType");

  const reserveeType = watch("reserveeType");

  return (
    <AutoGrid data-testid="reservation__form--reservee-info" className={className} style={style}>
      <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
      {isTypeSelectable && <CustomerTypeSelector />}
      <ReservationFormFields
        fields={fields}
        formType={reservationUnit.reservationForm}
        options={extendMetaFieldOptions(options, t)}
        hasSubheading
        headingKey={reserveeType}
        data={data}
        section="reservee"
      />
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
