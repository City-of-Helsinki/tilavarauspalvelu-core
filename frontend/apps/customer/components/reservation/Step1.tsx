import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import { Button, ButtonVariant, IconArrowLeft, LoadingSpinner } from "hds-react";
import { type ReservationQuery, ReservationStateChoice, useConfirmReservationMutation } from "@gql/gql-types";
import { useForm } from "react-hook-form";
import { type OptionsRecord } from "ui";
import { ActionContainer } from "./styles";
import { SummaryGeneralFields, SummaryReserveeFields } from "./SummaryFields";
import { AcceptTerms } from "./AcceptTerms";
import { NewReservationForm } from "@/styled/reservation";
import { useDisplayError } from "ui/src/hooks";
import { getReservationInProgressPath, getReservationPath, getReservationUnitPath } from "@/modules/urls";
import { convertLanguageCode } from "ui/src/modules/util";
import { getCheckoutUrl } from "@/modules/reservation";
import { useRouter } from "next/router";
import { gql } from "@apollo/client";
import { isNotFoundError } from "ui/src/modules/apolloUtils";

type NodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: NodeT;
  options: Omit<OptionsRecord, "municipality">;
  requiresPayment: boolean;
};

export function Step1({ reservation, options, requiresPayment }: Props): JSX.Element {
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
      // NOT_FOUND is non-recoverable so redirect to the reservation unit page
      if (isNotFoundError(err)) {
        router.push(getReservationUnitPath(reservation.reservationUnit?.pk));
      }
      displayError(err);
    }
  };

  const handleBack = async () => {
    await router.push(getReservationInProgressPath(reservation.reservationUnit.pk, reservation.pk, 0));
  };

  return (
    <NewReservationForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <SummaryGeneralFields reservation={reservation} options={options} />
      <SummaryReserveeFields reservation={reservation} options={options} />
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
