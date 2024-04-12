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
import { useTranslation } from "react-i18next";
import { camelCase } from "lodash";
import {
  type ReservationMetadataSetNode,
  CustomerTypeChoice,
  type ReservationUnitNode,
} from "../../types/gql-types";
import ReservationFormField from "./ReservationFormField";
import { Inputs, Reservation } from "./types";
import RadioButtonWithImage from "./RadioButtonWithImage";
import { fontMedium, fontRegular } from "../common/typography";
import type { OptionType } from "../../types/common";
import { GroupHeading, Subheading, TwoColumnContainer } from "./styles";
import IconPremises from "../icons/IconPremises";
import { containsField } from "../metaFieldsHelpers";
import { filterNonNullable } from "../helpers";

type CommonProps = {
  options: Record<string, OptionType[]>;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
};

type Field = string;
type Props = CommonProps & {
  reservationUnit: ReservationUnitNode;
  generalFields: Field[];
  reservationApplicationFields: Field[];
};

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
  margin: ${({ $zeroMargin }) =>
    $zeroMargin ? 0 : "var(--spacing-layout-m) 0 var(--spacing-xs)"};
`;

const ReserverInfoHeading = styled(Subheading)`
  margin: "var(--spacing-layout-m) 0 var(--spacing-xs)";
`;

const ReservationApplicationFieldsContainer = styled(TwoColumnContainer)`
  margin: "var(--spacing-layout-m) 0 var(--spacing-layout-m)";
`;

const reserveeOptions = [
  {
    id: CustomerTypeChoice.Individual,
    icon: <IconUser aria-hidden />,
  },
  {
    id: CustomerTypeChoice.Nonprofit,
    icon: <IconGroup aria-hidden />,
  },
  {
    id: CustomerTypeChoice.Business,
    icon: <IconPremises width="24" height="24" aria-hidden />,
  },
];

const SubheadingByType = ({
  reserveeType,
  index,
  field,
}: {
  reserveeType: CustomerTypeChoice;
  index: number;
  field: string;
}) => {
  const { t } = useTranslation();

  const headingForNonProfit =
    reserveeType === CustomerTypeChoice.Nonprofit && index === 0;

  const headingForNonProfitContactInfo =
    reserveeType === CustomerTypeChoice.Nonprofit &&
    field === "reserveeFirstName";

  const headingForCompanyInfo =
    reserveeType === CustomerTypeChoice.Business && index === 0;

  const headingForContactInfo =
    reserveeType === CustomerTypeChoice.Business &&
    field === "reserveeFirstName";

  return headingForNonProfit ? (
    <GroupHeading style={{ marginTop: 0 }}>
      {t("reservationApplication:label.headings.nonprofitInfo")}
    </GroupHeading>
  ) : headingForNonProfitContactInfo ? (
    <GroupHeading>
      {t("reservationApplication:label.headings.contactInfo")}
    </GroupHeading>
  ) : headingForCompanyInfo ? (
    <GroupHeading style={{ marginTop: 0 }}>
      {t("reservationApplication:label.headings.companyInfo")}
    </GroupHeading>
  ) : headingForContactInfo ? (
    <GroupHeading>
      {t("reservationApplication:label.headings.contactInfo")}
    </GroupHeading>
  ) : null;
};

const ReservationFormFields = ({
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
  headingKey?: CustomerTypeChoice | "COMMON";
  hasSubheading?: boolean;
  metadata?: ReservationMetadataSetNode;
  params?: { numPersons: { min?: number; max?: number } };
}) => {
  const { getValues } = useFormContext<Reservation>();

  const requiredFields = filterNonNullable(metadata?.requiredFields)
    .map((x) => x.fieldName)
    .map(camelCase);
  const fieldsExtended = fields.map((field) => ({
    field,
    required: requiredFields.find((x) => x === field) != null,
  }));

  // TODO the subheading logic is weird / inefficient
  // instead of adding it to sections (or dividing the fields array into sections with headings)
  // we check for index === 0 inside a loop invariant
  return (
    <>
      {fieldsExtended.map(({ field, required }, index) => (
        <Fragment key={`key-${field}-container`}>
          {hasSubheading && headingKey != null && headingKey !== "COMMON" && (
            <SubheadingByType
              reserveeType={headingKey}
              index={index}
              field={field}
              key={`key-${field}-subheading`}
            />
          )}
          <ReservationFormField
            key={`key-${field}`}
            field={field as unknown as keyof Inputs}
            options={options}
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
};

// TODO reduce prop drilling / remove unused props
export const ReservationMetaFields = ({
  fields,
  reservationUnit,
  options,
  data,
  noHeadingMarginal,
}: {
  fields: string[];
  reservationUnit: ReservationUnitNode;
  options: Record<string, OptionType[]>;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
  noHeadingMarginal?: boolean;
}) => {
  const { t } = useTranslation();

  if (fields.length === 0) {
    return null;
  }
  if (!reservationUnit.metadataSet) {
    return null;
  }

  return (
    <>
      <InfoHeading $zeroMargin={noHeadingMarginal}>
        {t("reservationCalendar:reservationInfo")}
      </InfoHeading>
      <TwoColumnContainer>
        <ReservationFormFields
          options={options}
          fields={fields}
          metadata={reservationUnit.metadataSet}
          headingKey="COMMON"
          params={{
            numPersons: {
              min:
                !reservationUnit.minPersons || reservationUnit.minPersons === 0
                  ? 1
                  : reservationUnit.minPersons,
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
      </TwoColumnContainer>
    </>
  );
};

const CustomerTypeChoiceSelector = () => {
  const { t } = useTranslation();

  return (
    <CustomerTypeChoiceContainer data-testid="reservation__checkbox--reservee-type">
      <Controller
        name="reserveeType"
        render={({ field: { value, onChange } }) => (
          <>
            {reserveeOptions.map(({ id, icon }) => (
              <RadioButtonWithImage
                key={id}
                id={id}
                label={t(
                  `reservationApplication:reserveeTypes.labels.${id.toLocaleLowerCase()}`
                )}
                onClick={() => onChange(id)}
                icon={icon}
                checked={value === id}
              />
            ))}
          </>
        )}
      />
    </CustomerTypeChoiceContainer>
  );
};

// TODO reduce prop drilling / remove unused props
export const ReserverMetaFields = ({
  fields,
  reservationUnit,
  options,
  data,
}: {
  // TODO should not be arbitary strings
  fields: string[];
  reservationUnit: ReservationUnitNode;
  options: Record<string, OptionType[]>;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
}) => {
  const { watch } = useFormContext<Reservation & Partial<Inputs>>();
  const { t } = useTranslation();

  const supportedFields = filterNonNullable(
    reservationUnit?.metadataSet?.supportedFields
  );
  const isTypeSelectable = containsField(supportedFields, "reserveeType");

  const reserveeType = watch("reserveeType");

  if (!reservationUnit.metadataSet) {
    return null;
  }
  return (
    <>
      <ReserverInfoHeading>
        {t("reservationCalendar:reserverInfo")}
      </ReserverInfoHeading>
      {isTypeSelectable && (
        <>
          <p id="reserveeType-label">
            {t("reservationApplication:reserveeTypePrefix")}
          </p>
          <CustomerTypeChoiceSelector />
        </>
      )}
      <ReservationApplicationFieldsContainer>
        <ReservationFormFields
          fields={fields}
          metadata={reservationUnit.metadataSet}
          options={options}
          hasSubheading
          headingKey={reserveeType}
          data={data}
        />
      </ReservationApplicationFieldsContainer>
    </>
  );
};

// TODO this should be deprecated (use the individual components instead)
// because we need the individual components for admin-ui (placement in dom changes)
// and this component has more props than dom nodes.
// Not removed yet since requires ui/ refactoring.
const MetaFields = ({
  reservationUnit,
  generalFields,
  reservationApplicationFields,
  options,
  data,
}: Props) => {
  if (!reservationUnit.metadataSet) {
    return null;
  }

  return (
    <Container>
      <ReservationMetaFields
        fields={generalFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
      <ReserverMetaFields
        fields={reservationApplicationFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
    </Container>
  );
};

export default MetaFields;
