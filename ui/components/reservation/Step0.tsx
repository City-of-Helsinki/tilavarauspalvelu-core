import { OptionType } from "common/types/common";
import { IconArrowLeft, IconArrowRight, IconGroup, IconUser } from "hds-react";
import Image from "next/image";
import React, { Fragment, ReactElement, useMemo, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import styled from "styled-components";
import { fontMedium, fontRegular } from "common/src/common/typography";
import RadioButtonWithImage from "common/src/reservation-form/RadioButtonWithImage";
import ReservationFormField from "common/src/reservation-form/ReservationFormField";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
} from "common/types/gql-types";
import { Inputs, Reservation } from "common/src/reservation-form/types";
import {
  GroupHeading,
  Subheading,
  TwoColumnContainer,
} from "common/src/reservation-form/styles";
import { MediumButton } from "../../styles/util";
import { ActionContainer } from "./styles";
import { getTranslation } from "../../modules/util";
import InfoDialog from "../common/InfoDialog";

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
  form: UseFormReturn<Inputs>;
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
  form,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const openPricingTermsRef = useRef();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

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
      {generalFields?.length > 0 && (
        <>
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
                  t={t}
                  key={`key-${field}`}
                  field={field as unknown as keyof Inputs}
                  options={options}
                  form={form as unknown as ReturnType<typeof useForm>}
                  metadataSet={reservationUnit.metadataSet}
                  reserveeType="common"
                  reservation={reservation}
                  params={{
                    numPersons: {
                      min: reservationUnit.minPersons || 0,
                      max: reservationUnit.maxPersons,
                    },
                  }}
                  data={{
                    subventionLabel: (
                      <Trans i18nKey="reservationApplication:label.common.applyingForFreeOfChargeWithLink">
                        Haen maksuttomuutta tai hinnan alennusta ja olen
                        tutustunut
                        <a
                          href="#"
                          ref={openPricingTermsRef}
                          onClick={(e) => {
                            e.preventDefault();
                            setIsDialogOpen(true);
                          }}
                        >
                          alennusperusteisiin
                        </a>
                      </Trans>
                    ),
                  }}
                />
              );
            })}
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
      {reservationUnit?.metadataSet?.supportedFields.includes(
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
                t={t}
                field={field as unknown as keyof Inputs}
                options={options}
                reserveeType={reserveeType}
                metadataSet={reservationUnit.metadataSet}
                reservation={reservation}
                form={form as unknown as ReturnType<typeof useForm>}
              />
            </Fragment>
          );
        })}
        <InfoDialog
          id="pricing-terms"
          heading={t("reservationUnit:pricingTerms")}
          text={getTranslation(reservationUnit.pricingTerms, "text")}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
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
