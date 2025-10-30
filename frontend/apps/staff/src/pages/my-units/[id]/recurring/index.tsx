import TimeZoneNotification from "ui/src/components/TimeZoneNotification";
import React from "react";
import { useTranslation } from "next-i18next";
import { ReservationSeriesForm } from "@lib/my-units/[id]/recurring/ReservationSeriesForm";
import { LinkPrev } from "@/components/LinkPrev";
import { H1 } from "ui/src/styled";
import { createNodeId, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import {
  SeriesReservationUnitDocument,
  UserPermissionChoice,
  type SeriesReservationUnitQuery,
  type SeriesReservationUnitQueryVariables,
} from "@gql/gql-types";
import { createClient } from "@/modules/apolloClient";
import { gql } from "@apollo/client";

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page({ apiBaseUrl, unitPk, reservationUnits }: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();

  const reservationUnitOptions = reservationUnits.map((unit) => ({
    label: unit?.nameFi ?? "",
    value: unit?.pk ?? 0,
  }));

  return (
    <AuthorizationChecker
      apiUrl={apiBaseUrl}
      permission={UserPermissionChoice.CanCreateStaffReservations}
      unitPk={unitPk}
    >
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
  const commonProps = await getCommonServerSideProps();
  const apolloClient = createClient(commonProps.apiBaseUrl, req);
  const unitData = await apolloClient.query<SeriesReservationUnitQuery, SeriesReservationUnitQueryVariables>({
    query: SeriesReservationUnitDocument,
    variables: { id: createNodeId("UnitNode", unitPk) },
  });
  const reservationUnits = unitData.data.unit?.reservationUnits ?? [];
  return {
    props: {
      unitPk,
      reservationUnits,
      ...commonProps,
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
