import React, { Fragment } from "react";
import { IconGroup, IconUser } from "hds-react";
import styled from "styled-components";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { MetadataSetsFragment, ReservationFormType, type ReservationUnitNode, ReserveeType } from "../../gql/gql-types";
import { ReservationFormField } from "./ReservationFormField";
import { type InputsT, type ReservationFormT } from "./types";
import { RadioButtonWithImage } from "./RadioButtonWithImage";
import { AutoGrid, fontMedium, fontRegular, H4, H5 } from "../../styled";
import { type OptionsRecord } from "../../types/common";
import IconPremises from "../icons/IconPremises";
import { formContainsField } from "../metaFieldsHelpers";
import { extendMetaFieldOptions } from "./util";

type CommonProps = {
  options: Readonly<Omit<OptionsRecord, "municipalities">>;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
};

type Field = string;
type Props = CommonProps & {
  reservationUnit: MetadataSetsFragment;
  generalFields: Field[];
  reservationApplicationFields: Field[];
};

const Subheading = styled(H4).attrs({ as: "h2" })``;

const GroupHeading = styled(H5)`
  grid-column: 1 / -1;
  margin-bottom: 0;
`;

const CustomerTypeChoiceContainer = styled.div`
  display: flex;
  margin-bottom: var(--spacing-3-xl);
  width: 100%;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
`;

const InfoHeading = styled(Subheading)<{ $zeroMargin?: boolean }>`
  margin: ${({ $zeroMargin }) => ($zeroMargin ? 0 : "var(--spacing-layout-m) 0 var(--spacing-xs)")};
`;

const MandatoryFieldsInfoText = styled.p`
  font-size: var(--fontsize-body-s);
`;

const ReserverInfoHeading = styled(Subheading)`
  margin: var(--spacing-layout-m) 0 var(--spacing-xs);
`;

const ReservationApplicationFieldsContainer = styled(AutoGrid)`
  margin: var(--spacing-layout-m) 0 var(--spacing-layout-m);
`;

const reserveeOptions = [
  {
    id: ReserveeType.Individual,
    icon: <IconUser />,
  },
  {
    id: ReserveeType.Nonprofit,
    icon: <IconGroup />,
  },
  {
    id: ReserveeType.Company,
    icon: <IconPremises width="24" height="24" aria-hidden />,
  },
];

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
  // TODO need to add usage for this to get required field (unless we hard code it in the Form itself?)
  formType: _,
}: CommonProps & {
  fields: Field[];
  headingKey?: ReserveeType | "COMMON";
  hasSubheading?: boolean;
  formType: ReservationFormType;
  params?: { numPersons: { min?: number; max?: number } };
}) {
  const { t } = useTranslation();
  const { getValues } = useFormContext<ReservationFormT>();

  const fieldsExtended = fields.map((field) => ({
    field,
    // TODO should have a separate function to check against formType
    required: true,
  }));

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
export function ReservationFormFieldsDetailsSection({
  fields,
  reservationUnit,
  options,
  data,
  noHeadingMarginal,
}: {
  fields: string[];
  reservationUnit: MetadataSetsFragment;
  noHeadingMarginal?: boolean;
} & CommonProps) {
  const { t } = useTranslation();

  if (fields.length === 0) {
    return null;
  }
  return (
    <>
      <InfoHeading $zeroMargin={noHeadingMarginal}>{t("reservationCalendar:reservationInfo")}</InfoHeading>
      <MandatoryFieldsInfoText>{t("forms:mandatoryFieldsText")}</MandatoryFieldsInfoText>
      <AutoGrid>
        <ReservationFormFields
          options={extendMetaFieldOptions(options, t)}
          fields={fields}
          formType={reservationUnit.reservationForm}
          headingKey="COMMON"
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

function CustomerTypeChoiceSelector() {
  const { t } = useTranslation();

  return (
    <CustomerTypeChoiceContainer data-testid="reservation__checkbox--reservee-type">
      <Controller
        name="reserveeType"
        render={({ field: { value, onChange } }) => (
          <>
            {reserveeOptions
              .map(({ id, icon }) => ({
                choice: id,
                icon,
                name: id,
              }))
              .map(({ choice, icon, name }) => (
                <RadioButtonWithImage
                  key={choice}
                  id={`reserveeType__${name}`}
                  label={t(`reservationApplication:reserveeTypes.labels.${name}`)}
                  onClick={() => onChange(choice)}
                  icon={icon}
                  checked={value === choice}
                />
              ))}
          </>
        )}
      />
    </CustomerTypeChoiceContainer>
  );
}

// TODO reduce prop drilling / remove unused props
export function ReservationFormFieldsReserveeSection({
  fields,
  reservationUnit,
  options,
  data,
}: {
  // TODO should not be arbitrary strings
  fields: string[];
  reservationUnit: Pick<ReservationUnitNode, "reservationForm">;
} & CommonProps) {
  const { watch } = useFormContext<ReservationFormT & Partial<InputsT>>();
  const { t } = useTranslation();

  const isTypeSelectable = formContainsField(reservationUnit.reservationForm, "reserveeType");

  const reserveeType = watch("reserveeType");

  return (
    <>
      <ReserverInfoHeading>{t("reservationCalendar:reserverInfo")}</ReserverInfoHeading>
      {isTypeSelectable && (
        <>
          <p id="reserveeType-label">{t("reservationApplication:reserveeTypePrefix")}</p>
          <CustomerTypeChoiceSelector />
        </>
      )}
      <ReservationApplicationFieldsContainer data-testid="reservation__form--reservee-info">
        <ReservationFormFields
          fields={fields}
          formType={reservationUnit.reservationForm}
          options={extendMetaFieldOptions(options, t)}
          hasSubheading
          headingKey={reserveeType}
          data={data}
        />
      </ReservationApplicationFieldsContainer>
    </>
  );
}

const Container = styled.div`
  margin-bottom: var(--spacing-m);

  label {
    ${fontMedium};

    span {
      line-height: unset;
      transform: unset;
      margin-left: 0;
      display: inline;
      font-size: unset;
    }
  }

  input[type="radio"] + label {
    ${fontRegular};
  }
`;

export function ReservationForm({
  reservationUnit,
  generalFields,
  reservationApplicationFields,
  options,
  data,
}: Props) {
  return (
    <Container>
      <ReservationFormFieldsDetailsSection
        fields={generalFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
      <ReservationFormFieldsReserveeSection
        fields={reservationApplicationFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
    </Container>
  );
}
