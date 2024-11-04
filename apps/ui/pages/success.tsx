import type { GetServerSidePropsContext } from "next";
import { ReservationStateChoice, ReservationStateQuery } from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  getCommonServerSideProps,
  getReservationByOrderUuid,
} from "@/modules/serverUtils";
import { getReservationPath } from "@/modules/urls";
import { createApolloClient } from "@/modules/apolloClient";
import { mapSingleParamToFormValue } from "@/modules/search";

// TODO implement (or add a longer timeout to the order query)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAX_NUM_RETRIES = 2;

// TODO should be moved to /reservations/success (we need to leave this page for backwards compatibility)
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
  const reservation = await getReservationByOrderUuid(apolloClient, orderId);

  if (reservation == null) {
    return notFoundValue;
  }
  return {
    redirect: {
      permanent: false,
      destination: getRedirectUrl(reservation),
    },
  };
}

type QueryT = NonNullable<ReservationStateQuery["reservation"]>;
type RedirectProps = Pick<QueryT, "state" | "pk">;
function getRedirectUrl(reservation: RedirectProps): string {
  switch (reservation.state) {
    case ReservationStateChoice.Confirmed:
    case ReservationStateChoice.RequiresHandling:
      return getReservationPath(reservation.pk, "confirmation");
    case ReservationStateChoice.Created:
    case ReservationStateChoice.WaitingForPayment:
    default:
      // TODO what is this error? or the query param, is it really used for something
      // also why not redirect to the reservation page? it shows the payment status and a link to the payment page
      return "/reservations?error=order1";
  }
}

export default () => null;
