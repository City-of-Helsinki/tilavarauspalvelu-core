import React from "react";
import {
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { ReservationConfirmation } from "@/components/reservation/ReservationConfirmation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import { ReservationPageWrapper } from "@/components/reservations/styles";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { getReservationPath } from "@/modules/urls";

function Confirmation({ apiBaseUrl, reservation }: PropsNarrowed) {
  const { t } = useTranslation();
  // TODO should have edit in the breadcrumb (and slug for reservation)
  const routes = [
    {
      slug: "/reservations",
      title: t("breadcrumb:reservations"),
    },
    {
      // NOTE Don't set slug. It hides the mobile breadcrumb
      slug: getReservationPath(reservation.pk),
      title: t("reservations:reservationName", { id: reservation.pk }),
    },
    {
      slug: "",
      title: t("breadcrumb:confirmation"),
    },
  ];

  return (
    // TODO the info card used to be on top on mobile (now it's below)
    <>
      <BreadcrumbWrapper route={routes} />
      <ReservationPageWrapper $nRows={2}>
        <ReservationConfirmation
          apiBaseUrl={apiBaseUrl}
          reservation={reservation}
        />
        <ReservationInfoCard reservation={reservation} type="confirmed" />
      </ReservationPageWrapper>
    </>
  );
}

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
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservation } = reservationData || {};

    if (reservation) {
      return {
        props: {
          reservation,
          ...getCommonServerSideProps(),
          ...(await serverSideTranslations(locale ?? "fi")),
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
      key: `${pk}-confirmation-${locale}`,
    },
  };
}

export default Confirmation;
