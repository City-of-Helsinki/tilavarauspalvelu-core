import React, { Fragment } from "react";
import styled from "styled-components";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import {
  type MetadataSetsFragment,
  ReservationFormType,
  type ReservationUnitNode,
  ReserveeType,
} from "../../gql/gql-types";
import { ReservationFormField } from "./ReservationFormField";
import { type InputsT, type ReservationFormT } from "./types";
import { AutoGrid, H4, H5 } from "../../styled";
import { type OptionsRecord } from "../../types/common";
import { type ExtendedFormFieldArray, extendMetaFieldOptions, formContainsField, type FormFieldArray } from "./util";
import { CustomerTypeSelector } from "./CustomerTypeSelector";

interface CommonProps {
  options: Readonly<Omit<OptionsRecord, "municipalities">>;
  data?: {
    termsForDiscount?: JSX.Element | string;
    enableSubvention?: boolean;
  };
}

interface ReservationFormProps extends CommonProps {
  reservationUnit: MetadataSetsFragment;
  generalFields: FormFieldArray;
  reservationApplicationFields: ExtendedFormFieldArray;
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

interface ReservationFormFieldsDetailsSectionProps extends CommonWithFields {
  reservationUnit: MetadataSetsFragment;
}

interface ReservationFormFieldsReserveeSectionProps extends CommonWithFields {
  reservationUnit: Pick<ReservationUnitNode, "reservationForm">;
}

const GroupHeading = styled(H5)`
  grid-column: 1 / -1;
  margin-bottom: 0;
`;

const Subheading = styled(H4).attrs({ as: "h2" })``;

const MandatoryFieldsInfoText = styled.p`
  font-size: var(--fontsize-body-s);
`;

const ReserverInfoHeading = styled(Subheading)`
  margin: var(--spacing-layout-m) 0 var(--spacing-xs);
`;

function SubheadingByType({
  reserveeType,
  index,
  field,
}: {
  reserveeType: ReserveeType;
  index: number;
  field: string;
}) {
  const { t } = useTranslation();

  const headingForNonProfit = reserveeType === ReserveeType.Nonprofit && index === 0;

  const headingForNonProfitContactInfo = reserveeType === ReserveeType.Nonprofit && field === "reserveeFirstName";

  const headingForCompanyInfo = reserveeType === ReserveeType.Company && index === 0;

  const headingForContactInfo = reserveeType === ReserveeType.Company && field === "reserveeFirstName";

  return headingForNonProfit ? (
    <GroupHeading style={{ marginTop: 0 }}>{t("reservationApplication:label.headings.nonprofitInfo")}</GroupHeading>
  ) : headingForNonProfitContactInfo ? (
    <GroupHeading>{t("reservationApplication:label.headings.contactInfo")}</GroupHeading>
  ) : headingForCompanyInfo ? (
    <GroupHeading style={{ marginTop: 0 }}>{t("reservationApplication:label.headings.companyInfo")}</GroupHeading>
  ) : headingForContactInfo ? (
    <GroupHeading>{t("reservationApplication:label.headings.contactInfo")}</GroupHeading>
  ) : null;
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
  const { getValues } = useFormContext<ReservationFormT>();

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
            field={field as unknown as keyof InputsT}
            options={extendMetaFieldOptions(options, t)}
            required={required}
            translationKey={headingKey}
            reservation={getValues()}
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
}: ReservationFormFieldsDetailsSectionProps) {
  const { t } = useTranslation();

  if (fields.length === 0) {
    return null;
  }
  return (
    <>
      <Subheading>{t("reservationCalendar:reservationInfo")}</Subheading>
      <MandatoryFieldsInfoText>{t("forms:mandatoryFieldsText")}</MandatoryFieldsInfoText>
      <AutoGrid>
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
    </>
  );
}

// TODO reduce prop drilling / remove unused props
export function ReservationFormReserveeSection({
  fields,
  reservationUnit,
  options,
  data,
}: ReservationFormFieldsReserveeSectionProps) {
  const { watch } = useFormContext<ReservationFormT & Partial<InputsT>>();
  const { t } = useTranslation();

  const isTypeSelectable = formContainsField(reservationUnit.reservationForm, "reserveeType");

  const reserveeType = watch("reserveeType");

  return (
    <>
      <ReserverInfoHeading>{t("reservationCalendar:reserverInfo")}</ReserverInfoHeading>
      {isTypeSelectable && <CustomerTypeSelector />}
      <AutoGrid data-testid="reservation__form--reservee-info">
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
    </>
  );
}

export function ReservationForm({
  reservationUnit,
  generalFields,
  reservationApplicationFields,
  options,
  data,
}: ReservationFormProps) {
  return (
    <>
      <ReservationFormGeneralSection
        fields={generalFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
      <ReservationFormReserveeSection
        fields={reservationApplicationFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
    </>
  );
}
