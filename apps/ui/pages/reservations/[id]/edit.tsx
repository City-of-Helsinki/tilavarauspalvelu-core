import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useSession } from "@/hooks/auth";
import { ReservationEdit } from "@/components/reservation/ReservationEdit";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import {
  type Query,
  type QueryReservationUnitArgs,
  type QueryReservationArgs,
  type ReservationUnitNodeReservableTimeSpansArgs,
  type ReservationUnitNodeReservationSetArgs,
  ReservationUnitNode,
} from "common/types/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import {
  OPENING_HOURS,
  RESERVATION_UNIT_QUERY,
} from "@/modules/queries/reservationUnit";
import { GET_RESERVATION } from "@/modules/queries/reservation";
import { toApiDate } from "common/src/common/util";
import { addYears } from "date-fns";
import { RELATED_RESERVATION_STATES } from "common/src/const";
import { CenterSpinner } from "@/components/common/common";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = params?.id;

  const commonProps = getCommonServerSideProps();
  const client = createApolloClient(commonProps.apiBaseUrl, ctx);

  if (Number.isFinite(Number(pk))) {
    // TODO why are we doing two separate queries? the linked reservationUnit should be part of the reservation query
    const resId = base64encode(`ReservationNode:${pk}`);
    const { data } = await client.query<Query, QueryReservationArgs>({
      query: GET_RESERVATION,
      fetchPolicy: "no-cache",
      variables: { id: resId },
    });
    const reservation = data?.reservation ?? undefined;

    const resUnitPk = reservation?.reservationUnit?.[0]?.pk;
    const id = resUnitPk
      ? base64encode(`ReservationUnitNode:${resUnitPk}`)
      : "";
    const { data: reservationUnitData } = await client.query<
      Query,
      QueryReservationUnitArgs
    >({
      query: RESERVATION_UNIT_QUERY,
      fetchPolicy: "no-cache",
      variables: { id },
    });
    const { reservationUnit } = reservationUnitData;

    // TODO why is this needed? why isn't it part of the reservationUnit query?
    // TODO remove this and combine it to the original query
    // TODO why is this necessary? why require a second client side query after the page has loaded?
    const now = new Date();
    const { data: additionalData } = await client.query<
      Query,
      QueryReservationUnitArgs &
        ReservationUnitNodeReservableTimeSpansArgs &
        ReservationUnitNodeReservationSetArgs
    >({
      query: OPENING_HOURS,
      fetchPolicy: "no-cache",
      variables: {
        id: base64encode(`ReservationUnitNode:${resUnitPk}`),
        startDate: toApiDate(new Date(now)) ?? "",
        endDate: toApiDate(addYears(new Date(), 1)) ?? "",
        state: RELATED_RESERVATION_STATES,
      },
    });

    const timespans = filterNonNullable(reservationUnit?.reservableTimeSpans);
    const moreTimespans = filterNonNullable(
      additionalData?.reservationUnit?.reservableTimeSpans
    ).filter((n) => n?.startDatetime != null && n?.endDatetime != null);
    const reservableTimeSpans = [...timespans, ...moreTimespans];
    const reservations = filterNonNullable(
      additionalData?.reservationUnit?.reservationSet
    );

    // FIXME
    const reservationUnitChanged: ReservationUnitNode = {
      ...reservationUnit,
      reservableTimeSpans,
      reservationSet: reservations,
    };

    // TODO check for nulls and return notFound if necessary
    return {
      props: {
        ...commonProps,
        ...(await serverSideTranslations(locale ?? "fi")),
        key: `${pk}-edit-${locale}`,
        pk,
        reservation: reservation ?? null,
        reservationUnit: reservationUnitChanged ?? null,
      },
    };
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

function ReservationEditPage(props: PropsNarrowed): JSX.Element {
  const { isAuthenticated } = useSession();
  const { t } = useTranslation();

  const { reservation, reservationUnit } = props;

  // NOTE should not end up here (SSR redirect to login)
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  // FIXME pass the reservation and reservationUnit to the components
  // Should return notFound if reservation or reservationUnit is null
  const isLoading = !reservation || !reservationUnit;
  if (isLoading) {
    return <CenterSpinner />;
  }

  return (
    <ReservationEdit
      apiBaseUrl={props.apiBaseUrl}
      reservation={reservation}
      reservationUnit={reservationUnit}
    />
  );
}

export default ReservationEditPage;
