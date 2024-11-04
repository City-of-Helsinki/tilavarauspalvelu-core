import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CancelledLinkSet } from "@/components/reservation/CancelledLinkSet";
import { H1 } from "common";
import {
  getCommonServerSideProps,
  getReservationByOrderUuid,
} from "@/modules/serverUtils";
import { useTranslation } from "next-i18next";
import { mapSingleParamToFormValue } from "@/modules/search";
import { createApolloClient } from "@/modules/apolloClient";
import {
  DeleteReservationDocument,
  type DeleteReservationMutation,
  type DeleteReservationMutationVariables,
} from "@/gql/gql-types";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";

// This is the callback page from webstore if user cancels the order
// TODO this would be nicer if we could use a reservation/[id]/cancelled page (or reservation/[id])
// but deleted reservations are not stored in the database so we can't show them
// also the page hierarchy is not clear
// compromise would be to use reservations/cancelled without the id (and staticly render the same page with no queries)
// this would allow refresh that page (and remove the cancel?orderId=... from the url)
// since this callback page should not be accessed by users in any case (nor left in the browser history)
function Cancel({ apiBaseUrl }: NarrowedProps): JSX.Element {
  const { t } = useTranslation();
  const routes = [
    {
      slug: "/reservations",
      title: t("breadcrumb:reservations"),
    },
    {
      // NOTE Don't set slug. It hides the mobile breadcrumb
      // TODO change this to "Peruttu" or something similar
      title: t("reservations:reservationName", { id: 0 }),
    },
  ];

  // using breadcrumbs because our page layout is clearer when all pages include them
  return (
    <>
      <BreadcrumbWrapper route={routes} />
      <H1 $noMargin>{t("reservations:reservationCancelledTitle")}</H1>
      <CancelledLinkSet apiBaseUrl={apiBaseUrl} />
    </>
  );
}

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
  if (reservation?.pk == null) {
    return notFoundValue;
  }

  const { errors } = await apolloClient.mutate<
    DeleteReservationMutation,
    DeleteReservationMutationVariables
  >({
    mutation: DeleteReservationDocument,
    variables: {
      input: {
        pk: reservation.pk.toString(),
      },
    },
  });

  if (errors != null) {
    // eslint-disable-next-line no-console
    console.error("Delete mutation failed with: ", errors);
    // TODO improve the error page (or redirect to home page alternatvely or to users own reservations or this reservation?)
    // if the reservation is deleted it will not show up anywhere (it's deleted from the database also)
    return {
      redirect: {
        destination: "/error",
        permanent: false,
      },
      props: {
        notFound: true,
      },
    };
  }

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type NarrowedProps = Exclude<Props, { notFound: boolean }>;

export default Cancel;
