import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { useSession } from "@/hooks/auth";
import { ReservationEdit } from "@/components/reservation/ReservationEdit";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import type { Query, QueryReservationArgs } from "common/types/gql-types";
import {
  base64encode,
  concatAffectedReservations,
  filterNonNullable,
} from "common/src/helpers";
import {
  RESERVATION_UNIT_PAGE_QUERY,
  type ReservationUnitWithAffectingArgs,
} from "@/modules/queries/reservationUnit";
import { GET_RESERVATION } from "@/modules/queries/reservation";
import { toApiDate } from "common/src/common/util";
import { addYears } from "date-fns";
import { RELATED_RESERVATION_STATES } from "common/src/const";

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

    // TODO this is copy pasta from reservation-unit/[id].tsx
    const today = new Date();
    const startDate = today;
    const endDate = addYears(today, 2);

    const resUnitPk = reservation?.reservationUnit?.[0]?.pk;
    const id = resUnitPk
      ? base64encode(`ReservationUnitNode:${resUnitPk}`)
      : "";
    const { data: reservationUnitData } = await client.query<
      Query,
      ReservationUnitWithAffectingArgs
    >({
      query: RESERVATION_UNIT_PAGE_QUERY,
      fetchPolicy: "no-cache",
      variables: {
        id,
        pk: resUnitPk ?? 0,
        beginDate: toApiDate(startDate) ?? "",
        endDate: toApiDate(endDate) ?? "",
        state: RELATED_RESERVATION_STATES,
      },
    });
    const { reservationUnit } = reservationUnitData;

    const timespans = filterNonNullable(reservationUnit?.reservableTimeSpans);
    const reservableTimeSpans = timespans;
    const reservationSet = filterNonNullable(
      reservationUnitData?.reservationUnit?.reservationSet
    );
    const affectingReservations = filterNonNullable(
      reservationUnitData?.affectingReservations
    );
    const reservations = concatAffectedReservations(
      reservationSet,
      affectingReservations,
      resUnitPk ?? 0
    );

    // TODO check for nulls and return notFound if necessary
    if (reservation != null && reservationUnit != null) {
      return {
        props: {
          ...commonProps,
          ...(await serverSideTranslations(locale ?? "fi")),
          key: `${pk}-edit-${locale}`,
          pk,
          reservation,
          // TODO the queries should be combined so that we don't need to do this
          reservationUnit: {
            ...reservationUnit,
            reservableTimeSpans: reservableTimeSpans ?? null,
            reservationSet: reservations ?? null,
          },
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

function ReservationEditPage(props: PropsNarrowed): JSX.Element {
  const { isAuthenticated } = useSession();
  const { t } = useTranslation();

  const { reservation, reservationUnit } = props;

  // NOTE should not end up here (SSR redirect to login)
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
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
