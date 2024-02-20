import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { State } from "common/types/gql-types";
import NotificationWrapper from "common/src/components/NotificationWrapper";
import { useCurrentUser } from "@/hooks/user";
import { BlackButton, Toast } from "@/styles/util";
import {
  useReservations,
  useOrder,
  useDeleteReservation,
} from "@/hooks/reservation";
import { getCheckoutUrl } from "@/modules/reservation";

const NotificationContent = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-s);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const BodyText = styled.p`
  margin: 0;
`;

const NotificationButtons = styled.div`
  display: flex;
  gap: var(--spacing-s);

  > button {
    white-space: nowrap;
  }
`;

const ReservationNotification = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { currentUser } = useCurrentUser();
  const { reservations } = useReservations({
    currentUser,
    states: [State.WaitingForPayment],
    orderBy: "-pk",
  });

  const reservation = reservations?.[0];

  const { order } = useOrder({
    orderUuid: reservation?.order?.orderUuid ?? undefined,
  });

  const {
    mutation: deleteReservation,
    deleted,
    error: deleteError,
    isLoading: isDeleteLoading,
  } = useDeleteReservation();

  const checkoutUrl = getCheckoutUrl(order, i18n.language);

  if (deleted) {
    return (
      <Toast
        type="success"
        position="top-center"
        dismissible
        label={t("notification:waitingForPayment.reservationCancelledTitle")}
        closeButtonLabelText={t("common:close")}
      />
    );
  }

  if (deleteError) {
    return (
      <Toast
        type="error"
        position="top-center"
        dismissible
        label={t("common:error.error")}
        closeButtonLabelText={t("common:close")}
      >
        <span>{t("errors:general_error")}</span>
      </Toast>
    );
  }

  if (!checkoutUrl) {
    return null;
  }
  return (
    <NotificationWrapper
      type="alert"
      dismissible
      centered
      label={t("notification:waitingForPayment.title")}
      closeButtonLabelText={t("common:close")}
      data-testid="unpaid-reservation-notification__title"
    >
      <NotificationContent>
        <BodyText>{t("notification:waitingForPayment.body")}</BodyText>
        <NotificationButtons>
          <BlackButton
            variant="secondary"
            size="small"
            onClick={() => {
              if (reservation?.pk) {
                deleteReservation({
                  variables: {
                    input: {
                      pk: reservation.pk,
                    },
                  },
                });
              }
            }}
            disabled={isDeleteLoading || !reservation?.pk}
            data-testid="reservation-notification__button--delete"
          >
            {t("notification:waitingForPayment.cancelReservation")}
          </BlackButton>
          <BlackButton
            variant="secondary"
            size="small"
            onClick={() => router.push(checkoutUrl)}
            data-testid="reservation-notification__button--checkout"
          >
            {t("notification:waitingForPayment.payReservation")}
          </BlackButton>
        </NotificationButtons>
      </NotificationContent>
    </NotificationWrapper>
  );
};

const UnpaidReservationNotification = () => {
  const router = useRouter();
  const restrictedRoutes = ["/reservation/cancel", "/success"];

  if (restrictedRoutes.some((route) => router.pathname.startsWith(route))) {
    return null;
  }

  return <ReservationNotification />;
};

export default UnpaidReservationNotification;
