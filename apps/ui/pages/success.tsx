import type { GetServerSidePropsContext } from "next";
import {
  ReservationStateChoice,
  ReservationStateQuery,
  useReservationStateQuery,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  getCommonServerSideProps,
  getReservationByOrderUuid,
} from "@/modules/serverUtils";
import { getReservationPath } from "@/modules/urls";
import { createApolloClient } from "@/modules/apolloClient";
import { mapSingleParamToFormValue } from "@/modules/search";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { CenterSpinner } from "common/styles/util";

// TODO should be moved to /reservations/success
// but because this is webstore callback page we need to leave the url (use an url rewrite)
// we can't tie this to a reservationPk because it's used as a return page from webstore
export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const commonProps = getCommonServerSideProps();

  const orderId = mapSingleParamToFormValue(query.orderId);
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
type RedirectProps = Pick<QueryT, "state" | "pk">;

/// @returns the url of the reservation or null if the reservation is still waiting for payment
/// because payments are done with webhooks, we might need to wait for it
/// the reservation is valid (and should be payed) but wait for the backend to confirm it
function getRedirectUrl(reservation: RedirectProps): string | null {
  switch (reservation.state) {
    case ReservationStateChoice.Confirmed:
    case ReservationStateChoice.RequiresHandling:
      return getReservationPath(reservation.pk, "confirmation");
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
function Page(pros: NarrowedProps): JSX.Element {
  const id = pros.reservation.id;
  // is there a point where we stop polling and return an error to the user?
  const { data } = useReservationStateQuery({
    variables: {
      id,
    },
    pollInterval: 500,
  });

  const router = useRouter();

  useEffect(() => {
    const reservation = data?.reservation;
    if (reservation == null) {
      return;
    }
    const redirectUrl = getRedirectUrl(reservation);
    if (redirectUrl != null) {
      router.replace(redirectUrl);
    }
  }, [data, router]);

  return <CenterSpinner />;
}

export default Page;
