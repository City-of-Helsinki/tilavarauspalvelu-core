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
  useReservationStateLazyQuery,
} from "@gql/gql-types";
import NotificationWrapper from "common/src/components/NotificationWrapper";
import { useCurrentUser } from "@/hooks";
import { getCheckoutUrl } from "@/modules/reservation";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { gql, useApolloClient } from "@apollo/client";
import { toApiDate } from "common/src/common/util";
import { errorToast, successToast } from "common/src/common/toast";
import { getReservationInProgressPath } from "@/modules/urls";
import { Button, ButtonSize, ButtonVariant, LoadingSpinner } from "hds-react";
import { Flex } from "common/styled";
import { getApiErrors } from "common/src/apolloUtils";
import { type ParsedUrlQuery } from "querystring";

const BodyText = styled.p`
  margin: 0;
`;

function isNotFoundError(e: unknown): boolean {
  const errors = getApiErrors(e);
  if (errors.length > 0) {
    const notFoundErrors = errors.filter((e) => e.code === "NOT_FOUND");
    return notFoundErrors.length > 0;
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
  const { data, refetch } = useListInProgressReservationsQuery({
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

  const [deleteReservation, { loading: isDeleteLoading }] =
    useDeleteReservationMutation();

  const order = unpaidReservation?.paymentOrder[0];
  const checkoutUrl = getCheckoutUrl(order, i18n.language);

  // Lazy minimal query to check if the reservation is still valid
  const [reservationQ] = useReservationStateLazyQuery({
    fetchPolicy: "no-cache",
  });

  const client = useApolloClient();
  const refreshQueryCache = () => {
    const p1 = client.refetchQueries({
      include: ["ReservationQuotaReached", "AffectingReservations"],
    });
    const p2 = refetch();
    return Promise.all([p1, p2]);
  };

  // NOTE don't need to invalidate the cache on reservations list page because Created is not shown on it.
  // how about WaitingForPayment?
  // it would still be proper to invalidate the cache so if there is such a page, it would show the correct data.
  const handleDelete = async (reservation: ReservationNotificationFragment) => {
    // If we are on the page for the reservation we are deleting, we should redirect to the front page.
    // The funnel page: reservation-unit/:pk/reservation/:pk should not show this notification at all.
    if (reservation?.pk) {
      try {
        const { data } = await deleteReservation({
          variables: {
            input: {
              pk: reservation.pk.toString(),
            },
          },
        });
        const deleted = data?.deleteTentativeReservation?.deleted;
        if (deleted) {
          successToast({
            text: t("notification:waitingForPayment.reservationCancelledTitle"),
          });
        }
      } catch (e) {
        // silently ignore NOT_FOUND (just refresh query cache)
        if (!isNotFoundError(e)) {
          throw e;
        }
      }
      if (
        shouldRedirectAfterDelete(reservation.pk, router.pathname, router.query)
      ) {
        router.push("/");
      } else {
        await refreshQueryCache();
      }
    }
  };

  // TODO should pass the reservation here and remove the useOrder hook
  const handleCheckout = () => {
    if (checkoutUrl) {
      router.push(checkoutUrl);
    }
  };

  const handleContinue = async (
    reservation: ReservationNotificationFragment
  ) => {
    const reservationUnit = reservation.reservationUnits.find(() => true);
    if (reservationUnit?.pk == null) {
      throw new Error("No reservation unit pk");
    }
    const res = await reservationQ({
      variables: {
        id: base64encode(`ReservationNode:${reservation.pk}`),
      },
    });
    if (res.data?.reservation == null) {
      errorToast({
        text: t("errors:api:NOT_FOUND"),
      });
      await refreshQueryCache();
      return;
    }
    const url = getReservationInProgressPath(
      reservationUnit.pk,
      reservation.pk
    );
    router.push(url);
  };

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

// we match both the base name (reservations) and the specific reservation pk
// NOTE we could remove this if the Created reservation would always redirect to the funnel page instead of reservation/:pk page
function shouldRedirectAfterDelete(
  reservationPk: number,
  pathname: string,
  query: ParsedUrlQuery
): boolean {
  const isReservationPage = pathname.includes("/reservations/");
  if (isReservationPage) {
    const { id } = query;
    if (id != null && typeof id === "string" && Number(id) === reservationPk) {
      return true;
    }
  }
  return false;
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
