import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ReservationEdit } from "@/components/reservation/ReservationEdit";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { createApolloClient } from "@/modules/apolloClient";
import {
  ReservationUnitPageDocument,
  type ReservationUnitPageQuery,
  type ReservationUnitPageQueryVariables,
  ReservationDocument,
  type ReservationQuery,
  type ReservationQueryVariables,
} from "@gql/gql-types";
import {
  base64encode,
  concatAffectedReservations,
  filterNonNullable,
} from "common/src/helpers";
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
    const { data } = await client.query<
      ReservationQuery,
      ReservationQueryVariables
    >({
      query: ReservationDocument,
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
      ReservationUnitPageQuery,
      ReservationUnitPageQueryVariables
    >({
      query: ReservationUnitPageDocument,
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
  const { reservation, reservationUnit } = props;

  return (
    <ReservationEdit
      apiBaseUrl={props.apiBaseUrl}
      reservation={reservation}
      reservationUnit={reservationUnit}
    />
  );
}

export default ReservationEditPage;
