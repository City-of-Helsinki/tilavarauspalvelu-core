import { breakpoints } from "common/src/common/style";
import { ReservationsReservationStateChoices } from "common/types/gql-types";
import { LoadingSpinner } from "hds-react";
import { signIn, useSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Container from "../components/common/Container";
import ReservationFail from "../components/reservation/ReservationFail";
import { authEnabled, authenticationIssuer } from "../modules/const";
import { useOrder, useReservation } from "../hooks/reservation";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const howManyTimeShouldWeRetryOrder = 2;

const StyledContainer = styled(Container)`
  display: flex;
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-layout-m);
  justify-content: center;

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
    margin-bottom: var(--spacing-layout-l);
  }
`;

const ReservationSuccess = () => {
  const session = useSession();
  const router = useRouter();
  const { orderId } = router.query as { orderId: string };

  const [isReservationInvalid, setIsReservationInvalid] =
    useState<boolean>(false);
  const [refreshRetries, setRefreshRetries] = useState<number>(0);

  const isCheckingAuth = session?.status === "loading";
  const isLoggedOut = authEnabled && session?.status === "unauthenticated";

  useEffect(() => {
    if (isLoggedOut) {
      signIn(authenticationIssuer, {
        callbackUrl: window.location.href,
      });
    }
  }, [isLoggedOut]);

  const {
    order,
    error: orderError,
    refreshError,
    loading: orderLoading,
    refresh,
    called: orderCalled,
  } = useOrder(orderId);

  const {
    reservation,
    error: reservationError,
    loading: reservationLoading,
  } = useReservation(parseInt(order?.reservationPk, 10));

  useEffect(() => {
    if (order && !orderLoading) {
      const { reservationPk, status } = order;
      if (!reservationPk) {
        setIsReservationInvalid(true);
        return;
      }

      if (status !== "PAID") {
        if (refreshRetries < howManyTimeShouldWeRetryOrder) {
          setRefreshRetries(refreshRetries + 1);
          refresh();
        } else {
          setIsReservationInvalid(true);
        }
      }
    }
  }, [order, refresh, refreshRetries, orderLoading]);

  useEffect(() => {
    if (refreshError && !orderLoading) {
      const errors = refreshError.graphQLErrors;
      if (errors[0].extensions.error_code === "EXTERNAL_SERVICE_ERROR") {
        if (refreshRetries < howManyTimeShouldWeRetryOrder) {
          const retries = refreshRetries + 1;
          setRefreshRetries(retries);
          refresh();
        } else {
          setIsReservationInvalid(true);
        }
      }
    }
  }, [refreshError, orderLoading, refreshRetries, refresh]);

  const isOrderFetched = orderCalled && order && !orderError;
  const isOrderValid = isOrderFetched && order?.status === "PAID";
  const isReservationValid = !reservationError && !isReservationInvalid;

  const readyToReport =
    !isLoggedOut && !isCheckingAuth && !orderLoading && !reservationLoading;

  useEffect(() => {
    if (!reservation?.state || !isOrderValid || reservationError) return;

    const { state } = reservation;

    switch (state) {
      case ReservationsReservationStateChoices.Created:
      case ReservationsReservationStateChoices.WaitingForPayment:
        router.replace(`/reservations?error=order1`);
        break;
      case ReservationsReservationStateChoices.Confirmed:
      case ReservationsReservationStateChoices.RequiresHandling:
      default:
        router.replace(`/reservation/confirmation/${reservation.pk}`);
    }
  }, [orderId, reservation, router, isOrderValid, reservationError]);

  if (readyToReport && !isOrderFetched) {
    return <ReservationFail type="order" />;
  }

  if (readyToReport && !isReservationValid) {
    return <ReservationFail type="reservation" />;
  }

  return (
    <StyledContainer>
      <LoadingSpinner />
    </StyledContainer>
  );
};

export default ReservationSuccess;
