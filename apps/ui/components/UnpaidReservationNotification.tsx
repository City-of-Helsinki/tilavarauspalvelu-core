import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import {
  ReservationOrderingChoices,
  ReservationTypeChoice,
  ReservationStateChoice,
  useDeleteReservationMutation,
  useListInProgressReservationsQuery,
  type ReservationNotificationFragment,
} from "@gql/gql-types";
import NotificationWrapper from "common/src/components/NotificationWrapper";
import { useCurrentUser } from "@/hooks";
import { getCheckoutUrl } from "@/modules/reservation";
import { filterNonNullable } from "common/src/helpers";
import { ApolloError, gql } from "@apollo/client";
import { toApiDate } from "common/src/common/util";
import { errorToast, successToast } from "common/src/common/toast";
import { getReservationInProgressPath } from "@/modules/urls";
import { Button, ButtonSize, ButtonVariant, LoadingSpinner } from "hds-react";
import { Flex } from "common/styled";

const BodyText = styled.p`
  margin: 0;
`;

function isNotFoundError(error: unknown): boolean {
  if (error == null) {
    return false;
  }

  if (error instanceof ApolloError) {
    const { graphQLErrors } = error;
    if (graphQLErrors.length > 0) {
      const NOT_FOUND = "NOT_FOUND";
      if (graphQLErrors[0]?.extensions == null) {
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
  reservation: ReservationNotificationFragment;
  disabled?: boolean;
  isLoading?: boolean;
}) {
  const order = reservation.paymentOrder.find(() => true);
  const startRemainingMinutes = order?.expiresInMinutes;
  const [remainingMinutes, setRemainingMinutes] = useState(
    startRemainingMinutes
  );
  const { t } = useTranslation(["notification, common"]);
  const isCreated = reservation.state === ReservationStateChoice.Created;

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
      <Flex $wrap="wrap" $direction="row">
        <BodyText>{text}</BodyText>
        <Flex $gap="s" $direction="row">
          <Button
            variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Secondary}
            size={ButtonSize.Small}
            onClick={onDelete}
            disabled={disabled || isLoading}
            iconStart={isLoading ? <LoadingSpinner small /> : undefined}
            data-testid="reservation-notification__button--delete"
          >
            {t("notification:waitingForPayment.cancelReservation")}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Small}
            disabled={disabled || isLoading}
            onClick={onNext}
            data-testid="reservation-notification__button--checkout"
          >
            {submitButtonText}
          </Button>
        </Flex>
      </Flex>
    </NotificationWrapper>
  );
}

export function InProgressReservationNotification() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useCurrentUser();
  const { data } = useListInProgressReservationsQuery({
    skip: !currentUser?.pk,
    variables: {
      state: [
        ReservationStateChoice.WaitingForPayment,
        ReservationStateChoice.Created,
      ],
      orderBy: ReservationOrderingChoices.PkDesc,
      user: currentUser?.pk ?? 0,
      beginDate: toApiDate(new Date()) ?? "",
      reservationType: ReservationTypeChoice.Normal,
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
    .find((r) => r.state === ReservationStateChoice.WaitingForPayment);
  const createdReservation = reservations
    .filter(() => !shouldHideCreatedNotification)
    .find((r) => r.state === ReservationStateChoice.Created);

  const [
    deleteReservation,
    { data: deleteData, error: deleteError, loading: isDeleteLoading },
  ] = useDeleteReservationMutation();
  const deleted = deleteData?.deleteTentativeReservation?.deleted;

  const order = unpaidReservation?.paymentOrder[0];
  const checkoutUrl = getCheckoutUrl(order, i18n.language);

  useEffect(() => {
    if (deleted) {
      successToast({
        text: t("notification:waitingForPayment.reservationCancelledTitle"),
      });
    }
  }, [deleted, t]);

  // NOTE don't need to invalidate the cache on reservations list page because Created is not shown on it.
  // how about WaitingForPayment?
  // it would still be proper to invalidate the cache so if there is such a page, it would show the correct data.
  const handleDelete = async (reservation: ReservationNotificationFragment) => {
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

  const handleContinue = (reservation: ReservationNotificationFragment) => {
    const reservationUnit = reservation.reservationUnits?.find(() => true);
    if (reservationUnit?.pk == null) {
      throw new Error("No reservation unit pk");
    }
    const url = getReservationInProgressPath(
      reservationUnit.pk,
      reservation?.pk
    );
    router.push(url);
  };

  useEffect(() => {
    if (deleteError && !isNotFoundError(deleteError)) {
      errorToast({
        text: t("errors:general_error"),
      });
    }
  }, [deleteError, t]);

  // We want to only show the most recent reservation one of each type
  const list = filterNonNullable([unpaidReservation, createdReservation]);

  return (
    <>
      {list.map((x) =>
        x.state === ReservationStateChoice.Created ? (
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

export const RESERVATION_NOTIFICATION_FRAGMENT = gql`
  fragment ReservationNotification on ReservationNode {
    id
    pk
    state
    paymentOrder {
      id
      expiresInMinutes
      checkoutUrl
    }
    reservationUnits {
      id
      pk
    }
  }
`;

export const IN_PROGRESS_RESERVATION_NOTIFICATION_QUERY = gql`
  query ListInProgressReservations(
    $state: [ReservationStateChoice!]
    $orderBy: [ReservationOrderingChoices!]
    $user: [Int]!
    $beginDate: Date!
    $reservationType: [ReservationTypeChoice!]
  ) {
    reservations(
      user: $user
      state: $state
      orderBy: $orderBy
      beginDate: $beginDate
      reservationType: $reservationType
    ) {
      edges {
        node {
          ...ReservationNotification
        }
      }
    }
  }
`;
