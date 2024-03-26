import React from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import {
  type ReservationNode,
  State,
  ReservationOrderingChoices,
} from "common/types/gql-types";
import NotificationWrapper from "common/src/components/NotificationWrapper";
import { useCurrentUser } from "@/hooks/user";
import { BlackButton, Toast } from "@/styles/util";
import {
  useReservations,
  useOrder,
  useDeleteReservation,
} from "@/hooks/reservation";
import { getCheckoutUrl } from "@/modules/reservation";
import { filterNonNullable } from "common/src/helpers";
import { reservationUnitPrefix } from "@/modules/const";

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

function ReservationNotification({
  onDelete,
  onNext,
  reservation,
  disabled,
  isLoading,
}: {
  onDelete: () => void;
  onNext: () => void;
  reservation: ReservationNode;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const { t } = useTranslation(["notification, common"]);

  const title =
    reservation.state === State.Created
      ? t("notification:createdReservation.title")
      : t("notification:waitingForPayment.title");
  const text =
    reservation.state === State.Created
      ? t("notification:createdReservation.body")
      : t("notification:waitingForPayment.body");
  const submitButtonText =
    reservation.state === State.Created
      ? t("notification:createdReservation.continueReservation")
      : t("notification:waitingForPayment.payReservation");
  return (
    <NotificationWrapper
      type="alert"
      dismissible
      centered
      label={title}
      closeButtonLabelText={t("common:close")}
      data-testid="unpaid-reservation-notification__title"
    >
      <NotificationContent>
        <BodyText>{text}</BodyText>
        <NotificationButtons>
          <BlackButton
            variant="secondary"
            size="small"
            onClick={onDelete}
            disabled={disabled}
            isLoading={isLoading}
            data-testid="reservation-notification__button--delete"
          >
            {t("notification:waitingForPayment.cancelReservation")}
          </BlackButton>
          <BlackButton
            variant="secondary"
            size="small"
            disabled={disabled}
            onClick={onNext}
            data-testid="reservation-notification__button--checkout"
          >
            {submitButtonText}
          </BlackButton>
        </NotificationButtons>
      </NotificationContent>
    </NotificationWrapper>
  );
}

export function InProgressReservationNotification() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useCurrentUser();
  const { reservations } = useReservations({
    currentUser,
    states: [State.WaitingForPayment, State.Created],
    orderBy: ReservationOrderingChoices.PkDesc,
  });

  // Hide on some routes
  // We want to filter these two routes for
  // WaitingForPayment: when cancelling and success
  // Created: user is already in the funnel (no need to redirect him to the funnel page)
  const hidePaymentNotificationRoutes = ["/reservation/cancel", "/success"];
  const hideCreatedNotificationRoutes = ["/reservation-unit/[...params]"];

  const router = useRouter();

  const shouldHidePaymentNotification = hidePaymentNotificationRoutes.some(
    (route) => router.pathname.startsWith(route)
  );
  const shouldHideCreatedNotification = hideCreatedNotificationRoutes.some(
    (route) => router.pathname.startsWith(route)
  );

  const unpaidReservation = reservations
    .filter(() => !shouldHidePaymentNotification)
    .find((r) => r.state === State.WaitingForPayment);
  const createdReservation = reservations
    .filter(() => !shouldHideCreatedNotification)
    .find((r) => r.state === State.Created);

  const {
    mutation: deleteReservation,
    deleted,
    error: deleteError,
    isLoading: isDeleteLoading,
  } = useDeleteReservation();

  const { order } = useOrder({
    orderUuid: unpaidReservation?.order?.orderUuid ?? undefined,
  });
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

  // NOTE don't need to invalidate the cache on reservations list page because Created is not shown on it.
  // how about WaitingForPayment?
  // it would still be proper to invalidate the cache so if there is such a page, it would show the correct data.
  const handleDelete = async (reservation?: ReservationNode) => {
    // If we are on the page for the reservation we are deleting, we should redirect to the front page.
    // The funnel page: reservation-unit/:pk/reservation/:pk should not show this notification at all.

    let shouldRedirect = false;
    // we match both the base name (reservations) and the specific reservation pk
    // NOTE we could remove this if the Created reservation would always redirect to the funnel page instead of reservation/:pk page
    const isReservationPage = router.pathname.includes("/reservations/");
    if (isReservationPage) {
      const { id } = router.query;
      if (
        id != null &&
        typeof id === "string" &&
        Number(id) === reservation?.pk
      ) {
        shouldRedirect = true;
      }
    }

    if (reservation?.pk) {
      await deleteReservation({
        variables: {
          input: {
            pk: reservation.pk.toString(),
          },
        },
      });
      if (shouldRedirect) {
        router.push("/");
      } else {
        // reload is necessary otherwise canceling on reservation-unit page will not remove the restriction
        // of making a new reservation (also fixes any other cached data)
        router.reload();
      }
    }
  };

  // TODO should pass the reservation here and remove the useOrder hook
  const handleCheckout = () => {
    if (checkoutUrl) {
      router.push(checkoutUrl);
    }
  };

  const handleContinue = (reservation?: ReservationNode) => {
    // TODO add an url builder for this
    // - reuse the url builder in [...params].tsx
    const reservationUnit = reservation?.reservationUnit?.find(() => true);
    const url = `${reservationUnitPrefix}/${reservationUnit?.pk}/reservation/${reservation?.pk}`;
    router.push(url);
  };

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

  // We want to only show the most recent reservation one of each type
  const list = filterNonNullable([unpaidReservation, createdReservation]);

  return (
    <>
      {list.map((x) =>
        x.state === State.Created ? (
          <ReservationNotification
            key={x.pk}
            onDelete={() => handleDelete(x)}
            onNext={() => handleContinue(x)}
            // disabled={!createdReservation?.pk}
            isLoading={isDeleteLoading}
            reservation={x}
          />
        ) : (
          <ReservationNotification
            key={x.pk}
            onDelete={() => handleDelete(x)}
            onNext={handleCheckout}
            disabled={!checkoutUrl}
            isLoading={isDeleteLoading}
            reservation={x}
          />
        )
      )}
    </>
  );
}
