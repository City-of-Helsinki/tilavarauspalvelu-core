import type { GetServerSidePropsContext } from "next";
import { OrderStatus, ReservationStateChoice, ReservationStateQuery, useReservationStateQuery } from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { getCommonServerSideProps, getReservationByOrderUuid } from "@/modules/serverUtils";
import { getReservationPath } from "@/modules/urls";
import { createApolloClient } from "@/modules/apolloClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { CenterSpinner } from "common/styled";
import { ignoreMaybeArray } from "common/src/helpers";
import { gql } from "@apollo/client";

const POLL_INTERVAL_MS = 500;
const STOP_POLLING_TIMEOUT_MS = 30000;

// TODO should be moved to /reservations/success
// but because this is webstore callback page we need to leave the url (use an url rewrite)
// we can't tie this to a reservationPk because it's used as a return page from webstore
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const commonProps = getCommonServerSideProps();

  const orderId = ignoreMaybeArray(query.orderId);
  const notFoundValue = {
    notFound: true,
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true,
    },
  };

  if (!orderId) {
    return notFoundValue;
  }

  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  // The reservation exists already if the orderUuid is valid
  const reservation = await getReservationByOrderUuid(apolloClient, orderId);

  if (reservation == null) {
    return notFoundValue;
  }

  const destination = getRedirectUrl(reservation);
  if (destination != null) {
    return {
      redirect: {
        permanent: false,
        destination,
      },
      // type narrowing requires this
      props: {
        notFound: true,
      },
    };
  }

  return {
    props: {
      reservation,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

type QueryT = NonNullable<ReservationStateQuery["reservation"]>;
type RedirectProps = Pick<QueryT, "state" | "pk" | "paymentOrder">;

/// @returns the url of the reservation or null if the reservation is still waiting for payment
/// because payments are done with webhooks, we might need to wait for it
/// the reservation is valid (and should be payed) but wait for the backend to confirm it
function getRedirectUrl(reservation: RedirectProps): string | null {
  switch (reservation.state) {
    case ReservationStateChoice.RequiresHandling:
      return getReservationPath(reservation.pk, undefined, "requires_handling");
    case ReservationStateChoice.Confirmed:
      if (!reservation.paymentOrder?.handledPaymentDueBy) {
        return getReservationPath(reservation.pk, undefined, "confirmed");
      }
      return getReservationPath(reservation.pk, undefined, "paid");
    case ReservationStateChoice.WaitingForPayment:
      return null;
    case ReservationStateChoice.Created:
    default:
      // TODO what is this error? or the query param, is it really used for something
      // also why not redirect to the reservation page? it shows the payment status and a link to the payment page
      return "/reservations?error=order1";
  }
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type NarrowedProps = Exclude<Props, { notFound: boolean }>;

/// Show loading page if the reservation is still waiting for payment
/// assuming the user landed here correctly from the webstore callback
/// the reservation is paid and confirmed but our backend hasn't updated the state yet
function Page(props: NarrowedProps): JSX.Element {
  const id = props.reservation.id;
  const [isPolling, setIsPolling] = useState(true);
  // is there a point where we stop polling and return an error to the user?
  const { data, stopPolling } = useReservationStateQuery({
    variables: {
      id,
    },
    pollInterval: isPolling ? POLL_INTERVAL_MS : 0,
  });

  const router = useRouter();
  useEffect(() => {
    const endPolling = setTimeout(() => {
      setIsPolling(false);
      stopPolling();
      router.replace(getReservationPath(props.reservation.pk, undefined, "polling_timeout"));
    }, STOP_POLLING_TIMEOUT_MS);
    return () => clearTimeout(endPolling);
  }, [stopPolling, props.reservation.pk, router]);

  useEffect(() => {
    const reservation = data?.reservation;
    if (
      reservation == null ||
      (reservation.paymentOrder?.status !== OrderStatus.Paid &&
        reservation.paymentOrder?.status !== OrderStatus.PaidByInvoice)
    ) {
      return;
    }
    const redirectUrl = getRedirectUrl(reservation);
    if (redirectUrl != null) {
      setIsPolling(false);
      stopPolling();
      router.replace(redirectUrl);
    }
  }, [data, router, stopPolling]);

  return <CenterSpinner />;
}

export default Page;

export const GET_RESERVATION_STATE = gql`
  query ReservationState($id: ID!) {
    reservation(id: $id) {
      id
      pk
      state
      paymentOrder {
        id
        status
        handledPaymentDueBy
      }
    }
  }
`;
