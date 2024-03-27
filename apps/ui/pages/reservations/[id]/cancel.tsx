import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  GET_RESERVATION,
  GET_RESERVATION_CANCEL_REASONS,
} from "@/modules/queries/reservation";
import type {
  Query,
  QueryReservationArgs,
  QueryReservationCancelReasonsArgs,
} from "common/types/gql-types";
import { useTranslation } from "next-i18next";
import Error from "next/error";
import { useSession } from "@/hooks/auth";
import ReservationCancellation from "@/components/reservation/ReservationCancellation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import { base64encode, filterNonNullable } from "common/src/helpers";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = params?.id;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    const typename = "ReservationNode";
    const id = base64encode(`${typename}:${pk}`);
    const { data: reservationData } = await client.query<
      Query,
      QueryReservationArgs
    >({
      query: GET_RESERVATION,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservation } = reservationData || {};

    const { data: cancelReasonsData } = await client.query<
      Query,
      QueryReservationCancelReasonsArgs
    >({
      query: GET_RESERVATION_CANCEL_REASONS,
      fetchPolicy: "no-cache",
    });

    const reasons = filterNonNullable(
      cancelReasonsData?.reservationCancelReasons?.edges.map(
        (edge) => edge?.node
      )
    );

    // TODO check for null and return notFound
    return {
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        key: `${pk}-cancel-{locale}`,
        reservation: reservation ?? null,
        reasons,
      },
    };
  }

  return {
    notFound: true,
    props: {
      notFound: true,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      key: `${pk}-cancel-${locale}`,
    },
  };
}

function ReservationParams(props: PropsNarrowed): JSX.Element {
  const { isAuthenticated } = useSession();
  const { t } = useTranslation("common");

  // NOTE should not end up here (SSR redirect to login)
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  // TODO can be removed if SSR returns notFound for nulls
  const { reservation } = props;
  if (reservation == null) {
    return <Error statusCode={404} />;
  }

  return <ReservationCancellation {...props} reservation={reservation} />;
}

export default ReservationParams;
