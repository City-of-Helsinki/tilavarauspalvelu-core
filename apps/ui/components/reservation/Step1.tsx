import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { type ReservationQuery } from "@gql/gql-types";
import { ReservationStateChoice, useConfirmReservationMutation } from "@gql/gql-types";
import { Button, ButtonVariant, IconArrowLeft, LoadingSpinner } from "hds-react";
import { useForm } from "react-hook-form";
import { type OptionsRecord } from "common";
import { type FieldName } from "common/src/modules/metaFieldsHelpers";
import { ActionContainer } from "./styles";
import { ApplicationFields, GeneralFields } from "./SummaryFields";
import { AcceptTerms } from "./AcceptTerms";
import { NewReservationForm } from "@/styled/reservation";
import { useDisplayError } from "common/src/hooks";
import { getReservationInProgressPath, getReservationPath } from "@/modules/urls";
import { convertLanguageCode } from "common/src/modules/util";
import { getCheckoutUrl } from "@/modules/reservation";
import { useRouter } from "next/router";
import { gql } from "@apollo/client";

type NodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: NodeT;
  supportedFields: FieldName[];
  options: Omit<OptionsRecord, "municipality">;
  requiresPayment: boolean;
};

export function Step1({ reservation, supportedFields, options, requiresPayment }: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  // empty react-hook-form on purpose (still using old useState for data)
  const {
    formState: { isSubmitting },
    handleSubmit,
  } = useForm();
  const router = useRouter();

  const { pk: reservationPk } = reservation || {};
  const displayError = useDisplayError();

  const [confirmReservation] = useConfirmReservationMutation();

  const [isTermsAccepted, setIsTermsAccepted] = useState({
    space: false,
    service: false,
  });

  const handleTermsAcceptedChange = (key: "space" | "service", val: boolean) => {
    setIsTermsAccepted({ ...isTermsAccepted, [key]: val });
  };

  const areTermsAccepted = isTermsAccepted.space && isTermsAccepted.service;

  const onSubmit = async (): Promise<void> => {
    try {
      const { data } = await confirmReservation({
        variables: {
          input: {
            pk: reservationPk ?? 0,
          },
        },
      });
      // window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      const { pk, state } = data?.confirmReservation ?? {};
      if (pk == null) {
        throw new Error("confirm reservation mutation failed");
      }

      if (state === ReservationStateChoice.Confirmed) {
        await router.push(getReservationPath(pk, undefined, "confirmed"));
      } else if (state === ReservationStateChoice.RequiresHandling) {
        await router.push(getReservationPath(pk, undefined, "requires_handling"));
      } else if (state === ReservationStateChoice.WaitingForPayment) {
        const { order } = data?.confirmReservation ?? {};
        const lang = convertLanguageCode(i18n.language);
        const checkoutUrl = getCheckoutUrl(order, lang);
        if (!checkoutUrl) {
          throw new Error("No checkout url found");
        }

        await router.push(checkoutUrl);
      } else {
        throw new Error("Invalid state");
      }
    } catch (err) {
      // TODO: NOT_FOUND at least is non-recoverable so we should redirect to the reservation unit page
      displayError(err);
    }
  };

  const handleBack = async () => {
    await router.push(getReservationInProgressPath(reservation.reservationUnit.pk, reservation.pk, 0));
  };

  return (
    <NewReservationForm onSubmit={handleSubmit(onSubmit)} noValidate>
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
          iconStart={<IconArrowLeft />}
          onClick={handleBack}
          data-testid="reservation__button--prev"
        >
          {t("common:prev")}
        </Button>
      </ActionContainer>
    </NewReservationForm>
  );
}

export const CONFIRM_RESERVATION = gql`
  mutation ConfirmReservation($input: ReservationConfirmMutationInput!) {
    confirmReservation(input: $input) {
      pk
      state
      order {
        id
        checkoutUrl
      }
    }
  }
`;
