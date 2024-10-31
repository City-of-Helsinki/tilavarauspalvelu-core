import React from "react";
import {
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
} from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetServerSidePropsContext } from "next";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import ReservationConfirmation from "@/components/reservation/ReservationConfirmation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { createApolloClient } from "@/modules/apolloClient";
import { ReservationPageWrapper } from "@/components/reservations/styles";

function Confirmation({ apiBaseUrl, reservation }: PropsNarrowed) {
  return (
    // FIXME the info card overscales the screen on mobile (probably similar problem on other pages)
    // TODO the info card used to be on top on mobile (now it's below)
    <ReservationPageWrapper $nRows={1}>
      <ReservationConfirmation
        apiBaseUrl={apiBaseUrl}
        reservation={reservation}
      />
      <ReservationInfoCard reservation={reservation} type="confirmed" />
    </ReservationPageWrapper>
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
