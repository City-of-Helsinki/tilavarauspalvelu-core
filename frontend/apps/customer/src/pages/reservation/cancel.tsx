import React from "react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ignoreMaybeArray } from "ui/src/modules/helpers";
import { H1 } from "ui/src/styled";
import { getApiErrors } from "@ui/modules/apolloUtils";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useEnvContext } from "@/context/EnvContext";
import { CancelledLinkSet } from "@/lib/reservation/[id]/cancel";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps, getReservationByOrderUuid } from "@/modules/serverUtils";
import { getReservationPath, reservationsPrefix } from "@/modules/urls";
import {
  DeleteReservationDocument,
  type DeleteReservationMutation,
  type DeleteReservationMutationVariables,
  ReservationStateChoice,
} from "@gql/gql-types";

// This is the callback page from webstore if user cancels the order
// TODO this would be nicer if we could use a reservation/[id]/cancelled page (or reservation/[id])
// but deleted reservations are not stored in the database so we can't show them
// also the page hierarchy is not clear
// compromise would be to use reservations/cancelled without the id (and staticly render the same page with no queries)
// this would allow refresh that page (and remove the cancel?orderId=... from the url)
// since this callback page should not be accessed by users in any case (nor left in the browser history)
function Cancel({ state }: NarrowedProps): JSX.Element {
  const { t } = useTranslation();
  const { env } = useEnvContext();
  const routes = [
    {
      slug: reservationsPrefix,
      title: t("breadcrumb:reservations"),
    },
    {
      title: t("reservation:cancel.reservation"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <H1 $noMargin>
        {state === "cancelled"
          ? t("reservation:reservationCancelledTitle")
          : state === "not-found"
            ? t("reservation:cancelReservationNotFoundTitle")
            : t("reservation:cancelReservationErrorTitle")}
      </H1>
      <CancelledLinkSet apiBaseUrl={env.apiBaseUrl} />
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, query } = ctx;
  const { apiBaseUrl } = getCommonServerSideProps();
  const orderId = ignoreMaybeArray(query.orderId);

  const notFoundValue = {
    notFound: true,
    props: {
      notFound: true,
    },
  };

  if (!orderId) {
    return notFoundValue;
  }

  const apolloClient = createApolloClient(apiBaseUrl, ctx);
  try {
    const reservation = await getReservationByOrderUuid(apolloClient, orderId);

    if (reservation?.pk == null) {
      return notFoundValue;
    }

    if (reservation?.state !== ReservationStateChoice.WaitingForPayment) {
      return {
        redirect: {
          destination: getReservationPath(reservation.pk),
          permanent: false,
        },
        props: {
          notFound: true,
        },
      };
    }

    await apolloClient.mutate<DeleteReservationMutation, DeleteReservationMutationVariables>({
      mutation: DeleteReservationDocument,
      variables: {
        input: {
          pk: reservation.pk.toString(),
        },
      },
    });

    return {
      props: {
        state: "cancelled" as const,
        ...(await serverSideTranslations(locale ?? "fi")),
      },
    };
  } catch (e) {
    const errors = getApiErrors(e);
    const notFoundError = errors.find((e) => e.code === "NOT_FOUND");
    return {
      props: {
        state: notFoundError != null ? ("not-found" as const) : ("error" as const),
        ...(await serverSideTranslations(locale ?? "fi")),
      },
    };
  }
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type NarrowedProps = Exclude<Props, { notFound: boolean }>;

export default Cancel;
