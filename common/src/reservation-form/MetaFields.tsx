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
import camelCase from "lodash/camelCase";
import { useFormContext } from "react-hook-form";

import {
  ReservationMetadataSetType,
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
} from "../../types/gql-types";
import ReservationFormField from "./ReservationFormField";
import { Inputs, Reservation } from "./types";
import RadioButtonWithImage from "./RadioButtonWithImage";
import { fontMedium, fontRegular } from "../common/typography";
import { OptionType } from "../../types/common";

import { GroupHeading, Subheading, TwoColumnContainer } from "./styles";
import IconPremises from "../icons/IconPremises";

type CommonProps = {
  options: Record<string, OptionType[]>;
  t: (key: string) => string;
  // TODO this should be refactored out to be the translation key
  reserveeType?: ReservationsReservationReserveeTypeChoices | "COMMON";
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
};

type Field = string;
type Props = CommonProps & {
  reservationUnit: ReservationUnitType;
  setReserveeType: React.Dispatch<
    React.SetStateAction<ReservationsReservationReserveeTypeChoices | undefined>
  >;
  generalFields: Field[];
  reservationApplicationFields: Field[];
};

const Container = styled.div`
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

const ReserveeTypeContainer = styled.div`
  display: flex;
  margin-bottom: var(--spacing-3-xl);
  width: 100%;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
`;

const InfoHeading = styled(Subheading)`
  margin: "var(--spacing-layout-m) 0 var(--spacing-xs)";
`;

const ReserverInfoHeading = styled(Subheading)`
  margin: "var(--spacing-layout-m) 0 var(--spacing-xs)";
`;

const ReservationApplicationFieldsContainer = styled(TwoColumnContainer)`
  margin: "var(--spacing-layout-m) 0 var(--spacing-layout-m)";
`;

const reserveeOptions = [
  {
    id: ReservationsReservationReserveeTypeChoices.Individual,
    icon: <IconUser aria-hidden />,
  },
  {
    id: ReservationsReservationReserveeTypeChoices.Nonprofit,
    icon: <IconGroup aria-hidden />,
  },
  {
    id: ReservationsReservationReserveeTypeChoices.Business,
    icon: <IconPremises width="24" height="24" aria-hidden />,
  },
];

const SubheadingByType = ({
  reserveeType,
  index,
  field,
  t,
}: {
  reserveeType: ReservationsReservationReserveeTypeChoices;
  index: number;
  field: string;
  t: (key: string) => string;
}) => {
  const headingForNonProfit =
    reserveeType === ReservationsReservationReserveeTypeChoices.Nonprofit &&
    index === 0;

  const headingForNonProfitContactInfo =
    reserveeType === ReservationsReservationReserveeTypeChoices.Nonprofit &&
    field === "reserveeFirstName";

  const headingForCompanyInfo =
    reserveeType === ReservationsReservationReserveeTypeChoices.Business &&
    index === 0;

  const headingForContactInfo =
    reserveeType === ReservationsReservationReserveeTypeChoices.Business &&
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
  t,
  // subheading is needed because application form uses it and requires index / field data to render it
  hasSubheading,
  reserveeType,
  metadata,
  params,
  data,
}: CommonProps & {
  fields: Field[];
  hasSubheading?: boolean;
  metadata?: ReservationMetadataSetType;
  params?: { numPersons: { min?: number; max?: number } };
}) => {
  const { getValues } = useFormContext<Reservation>();

  const fieldsExtended = fields.map((field) => ({
    field,
    required: (metadata?.requiredFields || [])
      .filter((x): x is string => x != null)
      .map(camelCase)
      .includes(field),
  }));

  return (
    <>
      {fieldsExtended.map(({ field, required }, index) => (
        <Fragment key={`key-${field}-container`}>
          {hasSubheading &&
            reserveeType != null &&
            reserveeType !== "COMMON" && (
              <SubheadingByType
                reserveeType={reserveeType}
                index={index}
                field={field}
                t={t}
                key={`key-${field}-subheading`}
              />
            )}
          <ReservationFormField
            key={`key-${field}`}
            field={field as unknown as keyof Inputs}
            options={options}
            required={required}
            reserveeType={reserveeType}
            reservation={getValues()}
            params={params}
            t={t}
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
  t,
  data,
}: {
  fields: string[];
  reservationUnit: ReservationUnitType;
  options: Record<string, OptionType[]>;
  t: (key: string) => string;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
}) => {
  if (fields.length === 0) {
    return null;
  }
  if (!reservationUnit.metadataSet) {
    return null;
  }

  return (
    <>
      <InfoHeading>{t("reservationCalendar:reservationInfo")}</InfoHeading>
      <TwoColumnContainer>
        <ReservationFormFields
          options={options}
          fields={fields}
          metadata={reservationUnit.metadataSet}
          reserveeType="COMMON"
          params={{
            numPersons: {
              min: reservationUnit.minPersons ?? 0,
              max:
                reservationUnit.maxPersons != null &&
                !Number.isNaN(reservationUnit.maxPersons) &&
                reservationUnit.maxPersons > 0
                  ? reservationUnit.maxPersons
                  : undefined,
            },
          }}
          data={data}
          t={t}
        />
      </TwoColumnContainer>
    </>
  );
};

// TODO reduce prop drilling / remove unused props
export const ReserverMetaFields = ({
  fields,
  reservationUnit,
  options,
  reserveeType,
  setReserveeType,
  t,
  data,
}: {
  fields: string[];
  reservationUnit: ReservationUnitType;
  options: Record<string, OptionType[]>;
  t: (key: string) => string;
  reserveeType?: ReservationsReservationReserveeTypeChoices | "COMMON";
  setReserveeType: React.Dispatch<
    React.SetStateAction<ReservationsReservationReserveeTypeChoices | undefined>
  >;
  data?: {
    termsForDiscount?: JSX.Element | string;
  };
}) => {
  const isTypeSelectable =
    reservationUnit?.metadataSet?.supportedFields?.includes("reservee_type") ??
    false;

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
          <p>{t("reservationApplication:reserveeTypePrefix")}</p>
          <ReserveeTypeContainer data-testid="reservation__checkbox--reservee-type">
            {reserveeOptions.map(({ id, icon }) => (
              <RadioButtonWithImage
                key={id}
                id={id}
                label={t(
                  `reservationApplication:reserveeTypes.labels.${id.toLocaleLowerCase()}`
                )}
                onClick={() => {
                  setReserveeType(id);
                }}
                icon={icon}
                checked={reserveeType === id}
              />
            ))}
          </ReserveeTypeContainer>
        </>
      )}
      <ReservationApplicationFieldsContainer>
        <ReservationFormFields
          fields={fields}
          metadata={reservationUnit.metadataSet}
          options={options}
          hasSubheading
          reserveeType={reserveeType}
          t={t}
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
  reserveeType,
  setReserveeType,
  generalFields,
  reservationApplicationFields,
  options,
  t,
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
        t={t}
        data={data}
      />
      <ReserverMetaFields
        fields={reservationApplicationFields}
        reserveeType={reserveeType}
        setReserveeType={setReserveeType}
        options={options}
        reservationUnit={reservationUnit}
        t={t}
        data={data}
      />
    </Container>
  );
};

export default MetaFields;
