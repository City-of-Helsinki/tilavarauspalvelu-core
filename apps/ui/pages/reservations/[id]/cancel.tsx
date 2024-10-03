import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  CurrentUserQuery,
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
import { CURRENT_USER } from "@/modules/queries/user";
import { getReservationPath } from "@/modules/urls";

type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

function ReservationCancelPage(props: PropsNarrowed): JSX.Element {
  const { reservation } = props;
  return <ReservationCancellation {...props} reservation={reservation} />;
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

    const { data: userData } = await client.query<CurrentUserQuery>({
      query: CURRENT_USER,
      fetchPolicy: "no-cache",
    });
    const user = userData?.currentUser;

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

    if (reservation?.user?.pk !== user?.pk) {
      return {
        notFound: true,
        props: {
          notFound: true,
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
        },
      };
    }
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
