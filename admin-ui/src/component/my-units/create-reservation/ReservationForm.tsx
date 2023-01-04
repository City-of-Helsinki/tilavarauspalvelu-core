import { OptionType } from "common/types/common";
import { IconGroup, IconUser } from "hds-react";
import React, { Fragment, ReactElement, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { fontMedium, fontRegular } from "common/src/common/typography";
import {
  ReservationMetadataSetType,
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import ReservationFormField from "common/src/reservation-form/ReservationFormField";
import { Inputs, Reservation } from "common/src/reservation-form/types";
import RadioButtonWithImage from "common/src/reservation-form/RadioButtonWithImage";

import {
  GroupHeading,
  Subheading,
  TwoColumnContainer,
} from "common/src/reservation-form/styles";
import { ReactComponent as IconPremises } from "../../../images/icon_premises.svg";

type Props = {
  reservationUnit: ReservationUnitType;
  reserveeType?: ReservationsReservationReserveeTypeChoices;
  setReserveeType: React.Dispatch<
    React.SetStateAction<ReservationsReservationReserveeTypeChoices | undefined>
  >;
  reservation: Reservation;
  generalFields: string[];
  reservationApplicationFields: string[];
  options: Record<string, OptionType[]>;
  form: ReturnType<typeof useForm>;
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

const ReservationForm = ({
  reservationUnit,
  reserveeType,
  setReserveeType,
  generalFields,
  reservation,
  reservationApplicationFields,
  options,
  form,
}: Props): JSX.Element | null => {
  const { t: originalT } = useTranslation();

  /** 'til namespaces are used in admin-ui, strip away napespace, add prefix */
  const t = (key: string) =>
    key.indexOf(":") !== -1
      ? originalT(`ReservationDialog.${key.substring(key.indexOf(":") + 1)}`)
      : originalT(key);

  const reserveeOptions = useMemo((): {
    id: ReservationsReservationReserveeTypeChoices;
    icon: ReactElement;
  }[] => {
    return [
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
  }, []);

  if (!reservationUnit.metadataSet) {
    return null;
  }

  const headingForNonProfit = (index: number) =>
    reserveeType === ReservationsReservationReserveeTypeChoices.Nonprofit &&
    index === 0;

  const headingForNonProfitContactInfo = (field: string) =>
    reserveeType === ReservationsReservationReserveeTypeChoices.Nonprofit &&
    field === "reserveeFirstName";

  const headingForCompanyInfo = (index: number) =>
    reserveeType === ReservationsReservationReserveeTypeChoices.Business &&
    index === 0;

  const headingForContactInfo = (field: string) =>
    reserveeType === ReservationsReservationReserveeTypeChoices.Business &&
    field === "reserveeFirstName";

  return (
    <Container>
      {generalFields?.length > 0 && (
        <>
          <Subheading
            style={{
              margin: "0 0 var(--spacing-xs)",
            }}
          >
            {t("ReservationDialog.reservationInfo")}
          </Subheading>
          <TwoColumnContainer>
            {generalFields.map((field) => (
              <ReservationFormField
                key={`key-${field}`}
                field={field as unknown as keyof Inputs}
                options={options}
                form={form}
                metadataSet={
                  reservationUnit.metadataSet as ReservationMetadataSetType
                }
                reserveeType="common"
                reservation={reservation}
                params={{
                  numPersons: {
                    min: reservationUnit.minPersons || 0,
                    max: !Number.isNaN(reservationUnit.maxPersons)
                      ? (reservationUnit.maxPersons as number)
                      : reservationUnit.minPersons || 0,
                  },
                }}
                data={{
                  subventionLabel: (
                    <Trans i18nKey="reservationApplication:label.common.applyingForFreeOfChargeWithLink">
                      Haen maksuttomuutta tai hinnan alennusta ja olen
                      tutustunut
                    </Trans>
                  ),
                }}
                t={t}
              />
            ))}
          </TwoColumnContainer>
        </>
      )}
      <Subheading
        style={{
          margin: "var(--spacing-layout-m) 0 var(--spacing-xs)",
        }}
      >
        {t("reservationCalendar:reserverInfo")}
      </Subheading>
      {reservationUnit?.metadataSet?.supportedFields?.includes(
        "reservee_type"
      ) && (
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
      <TwoColumnContainer
        style={{
          margin: "var(--spacing-layout-m) 0 var(--spacing-layout-m)",
        }}
      >
        {reservationApplicationFields.map((field, index) => {
          return (
            <Fragment key={`key-${field}`}>
              {headingForNonProfit(index) && (
                <GroupHeading style={{ marginTop: 0 }}>
                  {t("reservationApplication:label.headings.nonprofitInfo")}
                </GroupHeading>
              )}
              {headingForNonProfitContactInfo(field) && (
                <GroupHeading>
                  {t("reservationApplication:label.headings.contactInfo")}
                </GroupHeading>
              )}
              {headingForCompanyInfo(index) && (
                <GroupHeading style={{ marginTop: 0 }}>
                  {t("reservationApplication:label.headings.companyInfo")}
                </GroupHeading>
              )}{" "}
              {headingForContactInfo(field) && (
                <GroupHeading>
                  {t("reservationApplication:label.headings.contactInfo")}
                </GroupHeading>
              )}
              <ReservationFormField
                field={field as unknown as keyof Inputs}
                options={options}
                reserveeType={reserveeType}
                metadataSet={
                  reservationUnit.metadataSet as ReservationMetadataSetType
                }
                reservation={reservation}
                form={form}
                t={t}
              />
            </Fragment>
          );
        })}
      </TwoColumnContainer>
    </Container>
  );
};

export default ReservationForm;
