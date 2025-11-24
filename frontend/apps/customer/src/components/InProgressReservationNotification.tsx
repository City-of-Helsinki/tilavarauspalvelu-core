import React, { useEffect, useState } from "react";
import type { ParsedUrlQuery } from "node:querystring";
import { gql, useApolloClient } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import { Button, ButtonSize, ButtonVariant, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import NotificationWrapper from "ui/src/components/NotificationWrapper";
import { errorToast, successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import { isNotFoundError } from "ui/src/modules/apolloUtils";
import { formatApiDate } from "ui/src/modules/date-utils";
import { createNodeId, filterNonNullable, getLocalizationLang } from "ui/src/modules/helpers";
import { Flex } from "ui/src/styled";
import { useCurrentUser } from "@/hooks";
import { getCheckoutUrl } from "@/modules/reservation";
import { getReservationInProgressPath } from "@/modules/urls";
import {
  type ReservationNotificationFragment,
  ReservationOrderingChoices,
  ReservationStateChoice,
  ReservationTypeChoice,
  useDeleteReservationMutation,
  useListInProgressReservationsQuery,
  useReservationStateLazyQuery,
} from "@gql/gql-types";

const BodyText = styled.p`
  margin: 0;
`;

type ReservationNotificationProps = {
  onDelete: () => void;
  onNext: () => void;
  reservation: ReservationNotificationFragment;
  disabled?: boolean;
  isLoading?: boolean;
};

/// Get the time before the reservation expires
/// handle both Payment and Initial variants
/// backend doesn't return remaining time for Initial reservations
/// @return 0 if the reservation has expired otherwise time till expires in minutes
function getRemainingMinutes(reservation: ReservationNotificationFragment): number {
  if (reservation.state === ReservationStateChoice.WaitingForPayment) {
    return reservation.paymentOrder?.expiresInMinutes ?? 0;
  }
  if (reservation.state === ReservationStateChoice.Created && reservation.draftExpiresAt != null) {
    const expiresAt = new Date(reservation.draftExpiresAt);
    const till = differenceInMinutes(expiresAt, new Date());
    return Math.max(till, 0);
  }
  return 0;
}

function ReservationNotification({
  onDelete,
  onNext,
  reservation,
  disabled,
  isLoading,
}: ReservationNotificationProps): React.ReactElement | null {
  const [remainingMinutes, setRemainingMinutes] = useState(getRemainingMinutes(reservation));
  const { t } = useTranslation(["notification, common"]);
  const isCreated = reservation.state === ReservationStateChoice.Created;

  const translateKey = isCreated ? "notification:createdReservation" : "notification:waitingForPayment";
  const title = t(`${translateKey}.title`);
  const submitButtonText = t(`${translateKey}${".continueButton"}`);
  const text = t(`${translateKey}.body`, {
    time: remainingMinutes,
  });

  useEffect(() => {
    if (remainingMinutes > 0) {
      const updateTimeTimeout = setTimeout(() => {
        setRemainingMinutes(Math.max(remainingMinutes - 1, 0));
      }, 60_000);
      return () => clearTimeout(updateTimeTimeout);
    }
  }, [remainingMinutes]);

  const isExpired = remainingMinutes <= 0;
  if (isExpired) {
    return null;
  }

  return (
    <NotificationWrapper type="alert" centered label={title} data-testid="unpaid-reservation-notification__title">
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
            {t("notification:cancelReservationButton")}
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

export function InProgressReservationNotification(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { currentUser } = useCurrentUser();
  const { data, refetch } = useListInProgressReservationsQuery({
    skip: !currentUser?.pk,
    variables: {
      state: [ReservationStateChoice.WaitingForPayment, ReservationStateChoice.Created],
      orderBy: ReservationOrderingChoices.CreatedAtDesc,
      user: currentUser?.pk ?? 0,
      beginDate: formatApiDate(new Date()) ?? "",
      reservationType: ReservationTypeChoice.Normal,
    },
    fetchPolicy: "no-cache",
  });

  const reservations = filterNonNullable(data?.reservations?.edges.map((e) => e?.node));

  // Hide on some routes
  // We want to filter these two routes for
  // WaitingForPayment: when cancelling and success
  // Created: user is already in the funnel (no need to redirect him to the funnel page)
  const hidePaymentNotificationRoutes = ["/reservation/cancel", "/success"];
  const hideCreatedNotificationRoutes = ["/reservation-unit/[...params]"];

  const router = useRouter();

  const shouldHidePaymentNotification = hidePaymentNotificationRoutes.some((route) =>
    router.pathname.startsWith(route)
  );
  const shouldHideCreatedNotification = hideCreatedNotificationRoutes.some((route) =>
    router.pathname.startsWith(route)
  );

  const unpaidReservation = reservations
    .filter(() => !shouldHidePaymentNotification)
    .filter((r) => r.paymentOrder?.expiresInMinutes != null && r.paymentOrder?.expiresInMinutes > 0)
    .find((r) => r.state === ReservationStateChoice.WaitingForPayment);
  const createdReservation = reservations
    .filter(() => !shouldHideCreatedNotification)
    .find((r) => r.state === ReservationStateChoice.Created);

  const [deleteReservation, { loading: isDeleteLoading }] = useDeleteReservationMutation();

  const lang = getLocalizationLang(i18n.language);

  // Lazy minimal query to check if the reservation is still valid
  const [reservationQ] = useReservationStateLazyQuery({
    fetchPolicy: "no-cache",
  });

  const displayError = useDisplayError();

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
    // never happens but isn't type enforced
    if (reservation?.pk == null) {
      return;
    }
    // If we are on the page for the reservation we are deleting, we should redirect to the front page.
    // The funnel page: reservation-unit/:pk/reservation/:pk should not show this notification at all.
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
          text: t("notification:reservationCancelledTitle"),
        });
      }
    } catch (e) {
      // silently ignore NOT_FOUND (just refresh query cache)
      if (!isNotFoundError(e)) {
        displayError(e);
      }
    } finally {
      if (shouldRedirectAfterDelete(reservation.pk, router.pathname, router.query)) {
        router.push("/");
      } else {
        await refreshQueryCache();
      }
    }
  };

  const handleCheckout = (reservation: ReservationNotificationFragment) => {
    const checkoutUrl = getCheckoutUrl(reservation.paymentOrder, lang);
    if (checkoutUrl) {
      router.push(checkoutUrl);
    }
  };

  const handleContinue = async (reservation: ReservationNotificationFragment) => {
    // never happens but isn't type enforced
    if (reservation.reservationUnit.pk == null || reservation.pk == null) {
      return;
    }
    const res = await reservationQ({
      variables: {
        id: createNodeId("ReservationNode", reservation.pk),
      },
    });
    if (res.data?.reservation == null) {
      errorToast({
        text: t("errors:api:NOT_FOUND"),
      });
      await refreshQueryCache();
      return;
    }
    const url = getReservationInProgressPath(reservation.reservationUnit.pk, reservation.pk);
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
            isLoading={isDeleteLoading}
            reservation={x}
          />
        ) : (
          <ReservationNotification
            key={x.pk}
            onDelete={() => handleDelete(x)}
            onNext={() => handleCheckout(x)}
            disabled={x.paymentOrder?.checkoutUrl == null}
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
function shouldRedirectAfterDelete(reservationPk: number, pathname: string, query: ParsedUrlQuery): boolean {
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
    draftExpiresAt
    paymentOrder {
      id
      expiresInMinutes
      checkoutUrl
    }
    reservationUnit {
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
