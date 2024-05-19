import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import {
  State,
  ReservationOrderingChoices,
  useListReservationsQuery,
  type ListReservationsQuery,
} from "@gql/gql-types";
import NotificationWrapper from "common/src/components/NotificationWrapper";
import { useCurrentUser } from "@/hooks/user";
import { BlackButton, Toast } from "@/styles/util";
import { useOrder, useDeleteReservation } from "@/hooks/reservation";
import { getCheckoutUrl } from "@/modules/reservation";
import { filterNonNullable } from "common/src/helpers";
import { reservationUnitPrefix } from "@/modules/const";
import { ApolloError } from "@apollo/client";
import { toApiDate } from "common/src/common/util";

type QueryT = NonNullable<ListReservationsQuery["reservations"]>;
type EdgeT = NonNullable<QueryT["edges"][number]>;
type NodeT = NonNullable<EdgeT["node"]>;

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

function isNotFoundError(error: unknown): boolean {
  if (error == null) {
    return false;
  }

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      const NOT_FOUND = "NOT_FOUND";
      if (graphQLErrors[0].extensions == null) {
        return false;
      }
      return graphQLErrors[0].extensions.code === NOT_FOUND;
    }
  }
  return false;
}

function ReservationNotification({
  onDelete,
  onNext,
  reservation,
  disabled,
  isLoading,
}: {
  onDelete: () => void;
  onNext: () => void;
  reservation: NodeT;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const startRemainingMinutes = reservation.order?.expiresInMinutes;
  const [remainingMinutes, setRemainingMinutes] = useState(
    startRemainingMinutes
  );
  const { t } = useTranslation(["notification, common"]);
  const isCreated = reservation.state === State.Created;

  const translateKey = isCreated
    ? "notification:createdReservation"
    : "notification:waitingForPayment";
  const title = t(`${translateKey}.title`);
  const submitButtonText = t(
    `${translateKey}${isCreated ? ".continueReservation" : ".payReservation"}`
  );
  const text = t(`${translateKey}.body`, {
    time: remainingMinutes,
  });

  function countdownMinute(minutes: number) {
    if (minutes === 0) {
      return 0;
    }
    return minutes - 1;
  }
  useEffect(() => {
    const paymentTimeout = setTimeout(() => {
      const minutes = remainingMinutes ?? 0;
      setRemainingMinutes(countdownMinute(minutes));
    }, 60000);
    if (remainingMinutes === 0 || isCreated) {
      return clearTimeout(paymentTimeout);
    }
  }, [remainingMinutes, isCreated]);
  if (!isCreated && !remainingMinutes) {
    return null;
  }
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
            loadingText={t(
              "notification:waitingForPayment.cancelingReservation"
            )}
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
  const { data } = useListReservationsQuery({
    skip: !currentUser?.pk,
    variables: {
      state: [State.WaitingForPayment, State.Created],
      orderBy: ReservationOrderingChoices.PkDesc,
      user: currentUser?.pk?.toString() ?? "",
      beginDate: toApiDate(new Date()),
    },
    fetchPolicy: "no-cache",
  });

  const reservations = filterNonNullable(
    data?.reservations?.edges.map((e) => e?.node)
  );

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
  const handleDelete = async (reservation?: NodeT) => {
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
      try {
        await deleteReservation({
          variables: {
            input: {
              pk: reservation.pk.toString(),
            },
          },
        });
      } catch (e) {
        if (!isNotFoundError(e)) {
          throw e;
        }
      }
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

  const handleContinue = (reservation?: NodeT) => {
    // TODO add an url builder for this
    // - reuse the url builder in [...params].tsx
    const reservationUnit = reservation?.reservationUnit?.find(() => true);
    const url = `${reservationUnitPrefix}/${reservationUnit?.pk}/reservation/${reservation?.pk}`;
    router.push(url);
  };

  if (deleteError && !isNotFoundError(deleteError)) {
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
