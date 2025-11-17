import React from "react";
import { gql } from "@apollo/client";
import { ReservationSeriesForm } from "@lib/my-units/[id]/recurring/ReservationSeriesForm";
import { type GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import TimeZoneNotification from "ui/src/components/TimeZoneNotification";
import { createNodeId, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { H1 } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { LinkPrev } from "@/components/LinkPrev";
import { createClient } from "@/modules/apolloClient";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import {
  SeriesReservationUnitDocument,
  UserPermissionChoice,
  type SeriesReservationUnitQuery,
  type SeriesReservationUnitQueryVariables,
} from "@gql/gql-types";

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page({ unitPk, reservationUnits }: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();

  const reservationUnitOptions = reservationUnits.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? 0,
  }));

  return (
    <AuthorizationChecker permission={UserPermissionChoice.CanCreateStaffReservations} unitPk={unitPk}>
      <TimeZoneNotification />
      <LinkPrev />
      <H1 $noMargin>{t("myUnits:ReservationSeries.pageTitle")}</H1>
      {reservationUnitOptions.length > 0 ? (
        <ReservationSeriesForm reservationUnitOptions={reservationUnitOptions} unitPk={unitPk} />
      ) : (
        <p>{t("myUnits:ReservationSeries.error.notPossibleForThisUnit")}</p>
      )}
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ query, locale, req }: GetServerSidePropsContext) {
  const unitPk = toNumber(ignoreMaybeArray(query.id)) ?? 0;
  if (unitPk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  const { apiBaseUrl } = await getCommonServerSideProps();
  const apolloClient = createClient(apiBaseUrl, req);
  const unitData = await apolloClient.query<SeriesReservationUnitQuery, SeriesReservationUnitQueryVariables>({
    query: SeriesReservationUnitDocument,
    variables: { id: createNodeId("UnitNode", unitPk) },
  });
  const reservationUnits = unitData.data.unit?.reservationUnits ?? [];
  return {
    props: {
      unitPk,
      reservationUnits,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const SERIES_RESERVATION_UNIT_QUERY = gql`
  query SeriesReservationUnit($id: ID!) {
    unit(id: $id) {
      id
      nameFi
      pk
      reservationUnits {
        id
        pk
        nameFi
        reservationStartInterval
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;
