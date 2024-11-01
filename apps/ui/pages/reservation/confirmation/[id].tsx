import React from "react";
import { H1 } from "common/src/common/typography";
import {
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
} from "@gql/gql-types";
import { CenterSpinner } from "@/components/common/common";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { ReservationConfirmation } from "@/components/reservation/ReservationConfirmation";
import { ReservationInfoCard } from "@/components/reservation/ReservationInfoCard";
import { useOrder } from "@/hooks/reservation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { base64encode } from "common/src/helpers";
import { ReservationPageWrapper } from "@/components/reservations/styles";
import { createApolloClient } from "@/modules/apolloClient";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

// TODO test this (success after making a payment)
// TODO why is this different from reservations/[id]/confirmation.tsx it looks the same, uses the same base component etc.
// why not just create a hook that is skipped if the orderUuid is missing? i.e. it's free
function ReservationSuccess({ reservation, apiBaseUrl }: PropsNarrowed) {
  const { t } = useTranslation();

  // TODO the order should be included in the reservation query
  const {
    order,
    isError: orderError,
    isLoading: orderLoading,
  } = useOrder({ orderUuid: reservation?.paymentOrder[0]?.orderUuid ?? "" });

  const isOrderUuidMissing =
    reservation && !reservation.paymentOrder[0]?.orderUuid;

  // TODO display error if the orderUuid is missing or the pk is invalid
  if (orderError || isOrderUuidMissing) {
    return (
      <div>
        <H1>{t("common:error.error")}</H1>
        <p>{t("common:error.dataError")}</p>
      </div>
    );
  }

  if (orderLoading) {
    return <CenterSpinner />;
  }

  return (
    <ReservationPageWrapper>
      <ReservationInfoCard reservation={reservation} type="confirmed" />
      <ReservationConfirmation
        apiBaseUrl={apiBaseUrl}
        reservation={reservation}
        order={order}
      />
    </ReservationPageWrapper>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const commonProps = getCommonServerSideProps();
  const notFoundValue = {
    notFound: true,
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true,
    },
  };

  const reservationPk = Number(params?.id);
  const isValid = reservationPk > 0;
  if (!isValid) {
    return notFoundValue;
  }

  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);
  const id = base64encode(`ReservationNode:${reservationPk}`);
  const { data } = await apolloClient.query<
    ReservationQuery,
    ReservationQueryVariables
  >({
    query: ReservationDocument,
    variables: { id },
  });
  const { reservation } = data ?? {};

  if (reservation == null) {
    return notFoundValue;
  }

  return {
    props: {
      ...commonProps,
      reservation,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default ReservationSuccess;
