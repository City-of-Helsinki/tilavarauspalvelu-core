import React, { useEffect, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { ReservationStateChoice, useReservationQuery } from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useOrder } from "@/hooks/reservation";
import { ReservationFail } from "@/components/reservation/ReservationFail";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { CenterSpinner } from "@/components/common/common";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

const howManyTimeShouldWeRetryOrder = 2;

// TODO all the hook code is super suspicious
function ReservationSuccess({ apiBaseUrl }: Props) {
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

  const pk = order?.reservationPk ? parseInt(order?.reservationPk, 10) : 0;
  const typename = "ReservationNode";
  const id = base64encode(`${typename}:${pk}`);
  const { data, error, loading } = useReservationQuery({
    fetchPolicy: "no-cache",
    variables: { id },
    skip: !pk,
  });

  const reservation = data?.reservation ?? undefined;

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
  const isReservationValid = !error && !isReservationInvalid;

  useEffect(() => {
    if (!reservation?.state || !isOrderValid || error) return;

    const { state } = reservation;

    switch (state) {
      case ReservationStateChoice.Created:
      case ReservationStateChoice.WaitingForPayment:
        router.replace(`/reservations?error=order1`);
        break;
      case ReservationStateChoice.Confirmed:
      case ReservationStateChoice.RequiresHandling:
      default:
        router.replace(`/reservation/confirmation/${reservation.pk}`);
    }
  }, [orderId, reservation, router, isOrderValid, error]);

  if (!isOrderFetched) {
    return <ReservationFail apiBaseUrl={apiBaseUrl} type="order" />;
  }

  if (!isReservationValid) {
    return <ReservationFail apiBaseUrl={apiBaseUrl} type="reservation" />;
  }

  if (isOrderLoading || loading) {
    return <CenterSpinner />;
  }

  // NOTE weird fallback because we use useEffect to redirect on success
  return <CenterSpinner />;
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default ReservationSuccess;
