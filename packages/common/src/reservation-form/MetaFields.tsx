/**
 * MetaFields component
 * Defines the form fields that are available and required when making a
 * reservation.
 *
 * This is not really metadata but it's named metadata in the backend
 *
 * TODO this file should be split logically (and renamed after)
 * TODO when admin-ui uses translation namespaces remove passing the t function
 */
import { IconGroup, IconUser } from "hds-react";
import React, { Fragment } from "react";
import styled from "styled-components";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation, type TFunction } from "next-i18next";
import { camelCase } from "lodash-es";
import { MetadataSetsFragment, MunicipalityChoice, ReserveeType } from "../../gql/gql-types";
import { ReservationFormField } from "./ReservationFormField";
import { Inputs, type Reservation } from "./types";
import { RadioButtonWithImage } from "./RadioButtonWithImage";
import { AutoGrid, fontMedium, fontRegular, H4, H5 } from "../../styled";
import type { OptionsRecord } from "../../types/common";
import IconPremises from "../icons/IconPremises";
import { containsField } from "../metaFieldsHelpers";
import { filterNonNullable } from "../helpers";

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
  metadata,
  params,
  data,
}: CommonProps & {
  fields: Field[];
  headingKey?: ReserveeType | "COMMON";
  hasSubheading?: boolean;
  metadata: MetadataSetsFragment["metadataSet"];
  params?: { numPersons: { min?: number; max?: number } };
}) {
  const { t } = useTranslation();
  const { getValues } = useFormContext<Reservation>();

  const requiredFields = filterNonNullable(metadata?.requiredFields)
    .map((x) => x.fieldName)
    .map(camelCase);
  const fieldsExtended = fields.map((field) => ({
    field,
    required: requiredFields.some((x) => x === field) != null,
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
            field={field as unknown as keyof Inputs}
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
export function ReservationMetaFields({
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
  if (!reservationUnit.metadataSet) {
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
          metadata={reservationUnit.metadataSet}
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
export function ReserverMetaFields({
  fields,
  reservationUnit,
  options,
  data,
}: {
  // TODO should not be arbitrary strings
  fields: string[];
  reservationUnit: MetadataSetsFragment;
} & CommonProps) {
  const { watch } = useFormContext<Reservation & Partial<Inputs>>();
  const { t } = useTranslation();

  const supportedFields = filterNonNullable(reservationUnit?.metadataSet?.supportedFields);
  const isTypeSelectable = containsField(supportedFields, "reserveeType");

  const reserveeType = watch("reserveeType");

  if (!reservationUnit.metadataSet) {
    return null;
  }
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
          metadata={reservationUnit.metadataSet}
          options={extendMetaFieldOptions(options, t)}
          hasSubheading
          headingKey={reserveeType}
          data={data}
        />
      </ReservationApplicationFieldsContainer>
    </>
  );
}

// Modify options to include static enums
// the options Record (and down stream components don't narrow types properly)
// so missing keys are not type errors but instead turn Select components -> TextFields
export function extendMetaFieldOptions(options: Omit<OptionsRecord, "municipalities">, t: TFunction): OptionsRecord {
  return {
    ...options,
    municipalities: Object.values(MunicipalityChoice).map((value) => ({
      label: t(`common:municipalities.${value.toUpperCase()}`),
      value: value,
    })),
  };
}

// TODO this should be deprecated (use the individual components instead)
// because we need the individual components for admin-ui (placement in dom changes)
// and this component has more props than dom nodes.
// Not removed yet since requires ui/ refactoring.
function MetaFields({ reservationUnit, generalFields, reservationApplicationFields, options, data }: Props) {
  if (!reservationUnit.metadataSet) {
    return null;
  }

  return (
    <Container>
      <ReservationMetaFields fields={generalFields} options={options} reservationUnit={reservationUnit} data={data} />
      <ReserverMetaFields
        fields={reservationApplicationFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
    </Container>
  );
}

export default MetaFields;
