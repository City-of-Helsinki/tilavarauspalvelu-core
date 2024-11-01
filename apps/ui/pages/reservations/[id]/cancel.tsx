import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ReservationCancelReasonsDocument,
  type ReservationCancelReasonsQuery,
  type ReservationCancelReasonsQueryVariables,
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
} from "@gql/gql-types";
import { ReservationCancellation } from "@/components/reservation/ReservationCancellation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { isReservationCancellable } from "@/modules/reservation";
import { getReservationPath } from "@/modules/urls";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { useTranslation } from "next-i18next";

type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

function ReservationCancelPage(props: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();
  const { reservation } = props;
  // TODO should have cancel in the breadcrumb (and slug for the reservation)
  const routes = [
    {
      slug: "/reservations",
      title: t("breadcrumb:reservations"),
    },
    {
      // NOTE Don't set slug. It hides the mobile breadcrumb
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={routes} />
      <ReservationCancellation {...props} reservation={reservation} />
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = params?.id;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    const typename = "ReservationNode";
    const id = base64encode(`${typename}:${pk}`);
    const { data: reservationData } = await client.query<
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservation } = reservationData || {};

    const { data: cancelReasonsData } = await client.query<
      ReservationCancelReasonsQuery,
      ReservationCancelReasonsQueryVariables
    >({
      query: ReservationCancelReasonsDocument,
      fetchPolicy: "no-cache",
    });

    const reasons = filterNonNullable(
      cancelReasonsData?.reservationCancelReasons?.edges.map(
        (edge) => edge?.node
      )
    );

    const canCancel =
      reservation != null && isReservationCancellable(reservation);
    if (canCancel) {
      return {
        props: {
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
          reservation: reservation ?? null,
          reasons,
        },
      };
    } else if (reservation != null) {
      return {
        redirect: {
          permanent: true,
          destination: getReservationPath(reservation.pk),
        },
        props: {
          notFound: true, // for prop narrowing
        },
      };
    }
  }

  return {
    notFound: true,
    props: {
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default ReservationCancelPage;
