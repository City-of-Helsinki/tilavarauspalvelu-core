import React from "react";
import { useTranslation } from "next-i18next";
import { ReservationSeriesForm } from "@lib/my-units/[id]/recurring/ReservationSeriesForm";
import { useSeriesReservationsUnits } from "@/hooks";
import { LinkPrev } from "@/component/LinkPrev";
import { CenterSpinner, H1 } from "common/styled";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page({ apiBaseUrl, unitPk }: PropsNarrowed): JSX.Element {
  const { t } = useTranslation();
  const { loading, reservationUnits } = useSeriesReservationsUnits(unitPk);

  return (
    <AuthorizationChecker apiUrl={apiBaseUrl}>
      <LinkPrev />
      <H1 $noMargin>{t("myUnits:ReservationSeries.pageTitle")}</H1>
      {loading ? (
        <CenterSpinner />
      ) : reservationUnits.length > 0 ? (
        <ReservationSeriesForm reservationUnits={reservationUnits} unitPk={unitPk} />
      ) : (
        <p>{t("myUnits:ReservationSeries.error.notPossibleForThisUnit")}</p>
      )}
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ query, locale }: GetServerSidePropsContext) {
  const unitPk = toNumber(ignoreMaybeArray(query.id)) ?? 0;
  if (unitPk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  return {
    props: {
      unitPk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
