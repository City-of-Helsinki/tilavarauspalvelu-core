import { useLazyQuery, useMutation, useQuery } from "@apollo/client";
import { breakpoints } from "common/src/common/style";
import {
  MutationRefreshOrderArgs,
  PaymentOrderType,
  Query,
  QueryOrderArgs,
  QueryReservationByPkArgs,
  ReservationType,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { LoadingSpinner } from "hds-react";
import { signIn, useSession } from "next-auth/react";
import { GetStaticProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Container from "../components/common/Container";
import {
  GET_ORDER,
  GET_RESERVATION,
  REFRESH_ORDER,
} from "../modules/queries/reservation";
import ReservationFail from "../components/reservation/ReservationFail";
import { authenticationIssuer } from "../modules/const";

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

type Error = 1 | 2;

const howManyTimeShouldWeRetryOrder = 1;

const StyledContainer = styled(Container)`
  display: flex;
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-layout-m);
  justify-content: center;

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
    margin-bottom: var(--spacing-layout-l);
  }
`;

const ErrorWrapper = ({ error }: { error: Error }) => {
  return error === 1 ? (
    <ReservationFail type="reservation" />
  ) : error === 2 ? (
    <ReservationFail type="order" />
  ) : null;
};

const ReservationSuccess = () => {
  const session = useSession();
  const router = useRouter();
  const { orderId } = router.query as { orderId: string };

  const [error, setError] = useState<Error>(null);
  const [order, setOrder] = useState<PaymentOrderType>(null);
  const [reservation, setReservation] = useState<ReservationType>(null);
  const [refreshRetries, setRefreshRetries] = useState<number>(0);

  const isCheckingAuth = session?.status === "loading";
  const isLoggedOut = session?.status === "unauthenticated";
  useEffect(() => {
    if (isLoggedOut) {
      signIn(authenticationIssuer, {
        callbackUrl: window.location.href,
      });
    }
  }, [isLoggedOut]);

  const [
    refreshOrder,
    {
      data: refreshData,
      error: refreshError,
      loading: refreshLoading,
      reset: refreshReset,
    },
  ] = useMutation<Query, MutationRefreshOrderArgs>(REFRESH_ORDER, {
    fetchPolicy: "no-cache",
    variables: { input: { orderUuid: orderId } },
    onError: () => {},
  });

  const processOrder = async (paymentOrder: PaymentOrderType) => {
    if (!paymentOrder) {
      return;
    }

    const { reservationPk, status } = paymentOrder;

    if (!reservationPk) {
      setError(1);
      return;
    }

    if (status !== "PAID") {
      await refreshOrder({
        variables: { input: { orderUuid: orderId } },
      });
    } else {
      setOrder(paymentOrder);
    }
  };

  useQuery<Query, QueryOrderArgs>(GET_ORDER, {
    fetchPolicy: "no-cache",
    variables: { orderUuid: orderId },
    onCompleted: (data) => {
      if (!data.order) {
        setError(2);
      }
      processOrder(data.order);
    },
    onError: () => {},
    skip: !orderId || isLoggedOut || isCheckingAuth,
  });

  const [getReservation] = useLazyQuery<Query, QueryReservationByPkArgs>(
    GET_RESERVATION,
    {
      fetchPolicy: "no-cache",
      onCompleted: (data) => {
        if (data.reservationByPk?.pk) {
          setReservation(data.reservationByPk);
        } else {
          setError(1);
        }
      },
      onError: () => {
        setError(1);
      },
    }
  );

  useEffect(() => {
    if (refreshError && !refreshLoading) {
      try {
        const errors = refreshError.graphQLErrors;
        switch (errors[0].extensions.error_code) {
          case "EXTERNAL_SERVICE_ERROR":
            if (refreshRetries < howManyTimeShouldWeRetryOrder) {
              refreshReset();
              refreshOrder({
                variables: { input: { orderUuid: orderId } },
              });
              setRefreshRetries(refreshRetries + 1);
            } else {
              setError(1);
            }
            break;
          default:
        }
      } catch (e) {
        /* empty */
      }
    }
  }, [
    refreshData,
    refreshError,
    refreshReset,
    refreshOrder,
    refreshRetries,
    setRefreshRetries,
    refreshLoading,
    orderId,
  ]);

  useEffect(() => {
    if (order?.reservationPk && !refreshLoading) {
      getReservation({ variables: { pk: Number(order?.reservationPk) } });
    }
  }, [order, getReservation, refreshLoading]);

  useEffect(() => {
    if (!reservation?.state || error) return;

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
  }, [orderId, reservation, router, error]);

  if (error && !isLoggedOut && !isCheckingAuth) {
    return <ErrorWrapper error={error} />;
  }

  return (
    <StyledContainer>
      <LoadingSpinner />
    </StyledContainer>
  );
};

export default ReservationSuccess;
