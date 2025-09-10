import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import {
  ReservationStateChoice,
  useConfirmReservationMutation,
  type ReservationInProgressFragment,
} from "@gql/gql-types";
import { Button, ButtonVariant, IconArrowLeft, LoadingSpinner } from "hds-react";
import { useForm } from "react-hook-form";
import { type OptionsRecord } from "common";
import { ActionContainer } from "./styles";
import { SummaryGeneralFields, SummaryReserveeFields } from "./SummaryFields";
import { AcceptTerms } from "./AcceptTerms";
import { NewReservationForm } from "@/styled/reservation";
import { useDisplayError } from "common/src/hooks";
import { getReservationInProgressPath, getReservationPath, getReservationUnitPath } from "@/modules/urls";
import { convertLanguageCode } from "common/src/common/util";
import { getCheckoutUrl } from "@/modules/reservation";
import { useRouter } from "next/router";
import { gql } from "@apollo/client";
import { getApiErrors } from "common/src/apolloUtils";
import { errorToast } from "common/src/components/toast";

type Props = {
  reservation: ReservationInProgressFragment;
  options: Omit<OptionsRecord, "municipalities">;
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
        const { paymentOrder } = data?.confirmReservation ?? {};
        const lang = convertLanguageCode(i18n.language);
        const checkoutUrl = getCheckoutUrl(paymentOrder, lang);
        if (!checkoutUrl) {
          throw new Error("No checkout url found");
        }

        await router.push(checkoutUrl);
      } else {
        throw new Error("Invalid state");
      }
    } catch (err) {
      const apiErrors = getApiErrors(err);
      // The reservation has been destroyed by the backend (timeout)
      if (apiErrors.find((e) => e.code === "MODEL_INSTANCE_NOT_FOUND")) {
        errorToast({ text: t("errors:api.NOT_FOUND") });
        // FIXME this doesn't bypass the alert (check) that destroys the reservation
        // can't do url matching for it, so maybe we should refactor it to use an url param and remove url match?
        // we also need to remove the url param everywhere after
        await router.push(getReservationUnitPath(reservation.reservationUnit.pk));
      } else {
        displayError(err);
      }
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
  mutation ConfirmReservation($input: ReservationConfirmMutation!) {
    confirmReservation(input: $input) {
      pk
      state
      paymentOrder {
        id
        checkoutUrl
      }
    }
  }
`;
