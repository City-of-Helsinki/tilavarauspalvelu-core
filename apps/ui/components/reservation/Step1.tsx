import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { type ReservationQuery } from "@gql/gql-types";
import {
  Button,
  ButtonVariant,
  IconArrowLeft,
  IconArrowRight,
  LoadingSpinner,
  Notification,
} from "hds-react";
import { ActionContainer } from "./styles";
import { useFormContext } from "react-hook-form";
import {
  ApplicationFields,
  GeneralFields,
  type OptionsRecord,
} from "./SummaryFields";
import { type FieldName } from "common/src/metaFieldsHelpers";
import { AcceptTerms } from "./AcceptTerms";

type NodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: NodeT;
  supportedFields: FieldName[];
  options: OptionsRecord;
  requiresHandling: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

export function Step1({
  reservation,
  supportedFields,
  options,
  requiresHandling,
  setStep,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const {
    formState: { isSubmitting },
  } = useFormContext();

  const [isTermsAccepted, setIsTermsAccepted] = useState({
    space: false,
    service: false,
  });

  const handleTermsAcceptedChange = (
    key: "space" | "service",
    val: boolean
  ) => {
    setIsTermsAccepted({ ...isTermsAccepted, [key]: val });
  };

  const reservationUnit = reservation?.reservationUnits?.find(() => true);

  const areTermsAccepted = isTermsAccepted.space && isTermsAccepted.service;
  const submitText = t(
    `reservationCalendar:${requiresHandling ? "nextStep" : "makeReservation"}`
  );

  if (!reservationUnit) {
    return (
      <Notification type="error">{t("common:errors.dataError")}</Notification>
    );
  }
  return (
    <>
      <GeneralFields
        supportedFields={supportedFields}
        reservation={reservation}
        options={options}
      />
      <ApplicationFields
        reservation={reservation}
        options={options}
        supportedFields={supportedFields}
      />
      <AcceptTerms
        reservationUnit={reservationUnit}
        isTermsAccepted={isTermsAccepted}
        setIsTermsAccepted={handleTermsAcceptedChange}
      />
      <ActionContainer>
        <Button
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconEnd={
            isSubmitting ? (
              <LoadingSpinner small />
            ) : requiresHandling ? (
              <IconArrowRight aria-hidden="true" />
            ) : undefined
          }
          data-testid="reservation__button--continue"
          disabled={!areTermsAccepted || isSubmitting}
        >
          {submitText}
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          iconStart={<IconArrowLeft aria-hidden="true" />}
          onClick={() => setStep(0)}
          data-testid="reservation__button--cancel"
        >
          {t("common:prev")}
        </Button>
      </ActionContainer>
    </>
  );
}
