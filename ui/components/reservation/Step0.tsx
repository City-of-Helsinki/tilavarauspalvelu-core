import { OptionType } from "common/types/common";
import { IconArrowLeft, IconArrowRight, IconGroup, IconUser } from "hds-react";
import Image from "next/image";
import React, { Fragment, ReactElement, useMemo } from "react";
import { Control, DeepMap, FieldError } from "react-hook-form";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { fontMedium, fontRegular } from "common/src/common/typography";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
} from "../../modules/gql-types";
import { Inputs, Reservation } from "../../modules/types";
import { MediumButton } from "../../styles/util";
import RadioButtonWithImage from "../form/RadioButtonWithImage";
import ReservationFormField from "./ReservationFormField";
import {
  ActionContainer,
  GroupHeading,
  Subheading,
  TwoColumnContainer,
} from "./styles";

type Props = {
  reservation: Reservation;
  reservationUnit: ReservationUnitType;
  reserveeType: ReservationsReservationReserveeTypeChoices;
  setReserveeType: React.Dispatch<
    React.SetStateAction<ReservationsReservationReserveeTypeChoices>
  >;
  handleSubmit: () => void;
  generalFields: string[];
  reservationApplicationFields: string[];
  cancelReservation: () => void;
  options: Record<string, OptionType[]>;
  errors: DeepMap<Inputs, FieldError>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  watch: any;
};

const Form = styled.form`
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

const Step0 = ({
  reservation,
  reservationUnit,
  reserveeType,
  setReserveeType,
  handleSubmit,
  generalFields,
  reservationApplicationFields,
  cancelReservation,
  options,
  errors,
  control,
  register,
  watch,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const reserveeOptions = useMemo((): {
    id: ReservationsReservationReserveeTypeChoices;
    icon?: ReactElement;
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
        icon: (
          <Image
            src="/icons/icon_premises.svg"
            width="24"
            height="24"
            aria-hidden
          />
        ),
      },
    ];
  }, []);

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <Subheading
        style={{
          margin: "var(--spacing-layout-m) 0 var(--spacing-xs)",
        }}
      >
        {t("reservationCalendar:reservationInfo")}
      </Subheading>
      <TwoColumnContainer>
        {generalFields.map((field) => {
          return (
            <ReservationFormField
              key={`key-${field}`}
              field={field}
              options={options}
              register={register}
              errors={errors}
              metadataSet={reservationUnit.metadataSet}
              watch={watch}
              control={control}
              reserveeType="common"
              reservation={reservation}
              params={{
                numPersons: {
                  min: reservationUnit.minPersons || 0,
                  max: reservationUnit.maxPersons,
                },
              }}
            />
          );
        })}
      </TwoColumnContainer>
      <Subheading
        style={{
          margin: "var(--spacing-layout-m) 0 var(--spacing-xs)",
        }}
      >
        {t("reservationCalendar:reserverInfo")}
      </Subheading>
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
      <TwoColumnContainer
        style={{
          margin: "var(--spacing-layout-m) 0 var(--spacing-layout-xl)",
        }}
      >
        {reservationApplicationFields.map((field, index) => {
          return (
            <Fragment key={`key-${field}`}>
              {reserveeType ===
                ReservationsReservationReserveeTypeChoices.Nonprofit &&
                index === 0 && (
                  <GroupHeading style={{ marginTop: 0 }}>
                    {t("reservationApplication:label.headings.nonprofitInfo")}
                  </GroupHeading>
                )}
              {reserveeType ===
                ReservationsReservationReserveeTypeChoices.Nonprofit &&
                field === "reserveeFirstName" && (
                  <GroupHeading>
                    {t("reservationApplication:label.headings.contactInfo")}
                  </GroupHeading>
                )}
              {reserveeType ===
                ReservationsReservationReserveeTypeChoices.Business &&
                index === 0 && (
                  <GroupHeading style={{ marginTop: 0 }}>
                    {t("reservationApplication:label.headings.companyInfo")}
                  </GroupHeading>
                )}{" "}
              {reserveeType ===
                ReservationsReservationReserveeTypeChoices.Business &&
                field === "reserveeFirstName" && (
                  <GroupHeading>
                    {t("reservationApplication:label.headings.contactInfo")}
                  </GroupHeading>
                )}
              <ReservationFormField
                field={field}
                options={options}
                reserveeType={reserveeType}
                metadataSet={reservationUnit.metadataSet}
                reservation={reservation}
                errors={errors}
                control={control}
                register={register}
                watch={watch}
              />
            </Fragment>
          );
        })}
      </TwoColumnContainer>
      <ActionContainer>
        <MediumButton
          variant="primary"
          type="submit"
          iconRight={<IconArrowRight aria-hidden />}
          data-test="reservation__button--update"
        >
          {t("reservationCalendar:nextStep")}
        </MediumButton>
        <MediumButton
          variant="secondary"
          iconLeft={<IconArrowLeft aria-hidden />}
          onClick={() => {
            cancelReservation();
          }}
          data-test="reservation__button--cancel"
        >
          {t("common:cancel")}
        </MediumButton>
      </ActionContainer>
    </Form>
  );
};

export default Step0;
