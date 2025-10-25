import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { type ReservationQuery } from "@gql/gql-types";
import { Button, ButtonVariant, IconArrowLeft, LoadingSpinner, Notification } from "hds-react";
import { useFormContext } from "react-hook-form";
import { type OptionsRecord } from "common";
import { type FieldName } from "common/src/modules/metaFieldsHelpers";
import { ActionContainer } from "./styles";
import { ApplicationFields, GeneralFields } from "./SummaryFields";
import { AcceptTerms } from "./AcceptTerms";

type NodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: NodeT;
  supportedFields: FieldName[];
  options: Omit<OptionsRecord, "municipality">;
  requiresPayment: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

export function Step1({ reservation, supportedFields, options, requiresPayment, setStep }: Props): JSX.Element {
  const { t } = useTranslation();
  const {
    formState: { isSubmitting },
  } = useFormContext();

  const [isTermsAccepted, setIsTermsAccepted] = useState({
    space: false,
    service: false,
  });

  const handleTermsAcceptedChange = (key: "space" | "service", val: boolean) => {
    setIsTermsAccepted({ ...isTermsAccepted, [key]: val });
  };

  const areTermsAccepted = isTermsAccepted.space && isTermsAccepted.service;

  if (!reservation.reservationUnit) {
    return <Notification type="error">{t("common:errors.dataError")}</Notification>;
  }
  return (
    <>
      <GeneralFields supportedFields={supportedFields} reservation={reservation} options={options} />
      <ApplicationFields reservation={reservation} options={options} supportedFields={supportedFields} />
      <AcceptTerms
        reservationUnit={reservation.reservationUnit}
        isTermsAccepted={isTermsAccepted}
        setIsTermsAccepted={handleTermsAcceptedChange}
      />
      <ActionContainer>
        <Button
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconEnd={isSubmitting ? <LoadingSpinner small /> : undefined}
          data-testid="reservation__button--continue"
          disabled={!areTermsAccepted || isSubmitting}
        >
          {requiresPayment
            ? t("notification:waitingForPayment.payReservation")
            : t("reservationCalendar:makeReservation")}
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          iconStart={<IconArrowLeft aria-hidden="true" />}
          onClick={() => setStep(0)}
          data-testid="reservation__button--prev"
        >
          {t("common:prev")}
        </Button>
      </ActionContainer>
    </>
  );
}
