import React, { useEffect, useState } from "react";
import { LoadingSpinner } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { State } from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Container } from "common";
import { useOrder, useReservation } from "@/hooks/reservation";
import ReservationFail from "@/components/reservation/ReservationFail";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale } = ctx;

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
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

const ReservationSuccess = ({ apiBaseUrl }: Props) => {
  const router = useRouter();
  const { orderId } = router.query as { orderId: string };

  const [isReservationInvalid, setIsReservationInvalid] =
    useState<boolean>(false);
  const [refreshRetries, setRefreshRetries] = useState<number>(0);

  const {
    order,
    isError: orderError,
    refreshError,
    isLoading: isOrderLoading,
    refresh,
    called: orderCalled,
  } = useOrder({ orderUuid: orderId });

  const {
    reservation,
    error: reservationError,
    loading: reservationLoading,
  } = useReservation({
    reservationPk: order?.reservationPk
      ? parseInt(order?.reservationPk, 10)
      : 0,
  });

  useEffect(() => {
    if (order && !isOrderLoading) {
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
  }, [order, refresh, refreshRetries, isOrderLoading]);

  useEffect(() => {
    if (refreshError && !isOrderLoading) {
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
  }, [refreshError, isOrderLoading, refreshRetries, refresh]);

  const isOrderFetched = orderCalled && order && !orderError;
  const isOrderValid = isOrderFetched && order?.status === "PAID";
  const isReservationValid = !reservationError && !isReservationInvalid;

  useEffect(() => {
    if (!reservation?.state || !isOrderValid || reservationError) return;

    const { state } = reservation;

    switch (state) {
      case State.Created:
      case State.WaitingForPayment:
        router.replace(`/reservations?error=order1`);
        break;
      case State.Confirmed:
      case State.RequiresHandling:
      default:
        router.replace(`/reservation/confirmation/${reservation.pk}`);
    }
  }, [orderId, reservation, router, isOrderValid, reservationError]);

  if (isOrderLoading || reservationLoading) {
    return (
      <StyledContainer>
        <LoadingSpinner />
      </StyledContainer>
    );
  }

  if (!isOrderFetched) {
    return <ReservationFail apiBaseUrl={apiBaseUrl} type="order" />;
  }

  if (!isReservationValid) {
    return <ReservationFail apiBaseUrl={apiBaseUrl} type="reservation" />;
  }

  // NOTE weird fallback because we use useEffect to redirect on success
  return (
    <StyledContainer>
      <LoadingSpinner />
    </StyledContainer>
  );
};

export default ReservationSuccess;
