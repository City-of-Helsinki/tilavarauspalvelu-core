import React from "react";
import { useTranslation } from "next-i18next";
import { ReservationSeriesForm } from "./_components/ReservationSeriesForm";
import { useSeriesReservationsUnits } from "@/hooks";
import { LinkPrev } from "@/component/LinkPrev";
import { CenterSpinner, H1 } from "common/styled";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { useRouter } from "next/router";
import { AuthorizationChecker } from "@/common/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";

function ReservationSeriesInner({ unitPk }: { unitPk: number }) {
  const { t } = useTranslation();

  const { loading, reservationUnits } = useSeriesReservationsUnits(unitPk);

  return (
    <>
      <H1 $noMargin>{t("myUnits:ReservationSeries.pageTitle")}</H1>
      {loading ? (
        <CenterSpinner />
      ) : reservationUnits.length > 0 ? (
        <ReservationSeriesForm reservationUnits={reservationUnits} />
      ) : (
        <p>{t("myUnits:ReservationSeries.error.notPossibleForThisUnit")}</p>
      )}
    </>
  );
}

function ReservationSeriesErrorPage() {
  const { t } = useTranslation();
  return <div>{t("myUnits:ReservationSeries.error.invalidUnitId")}</div>;
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(props: PageProps): JSX.Element {
  const router = useRouter();
  const unitPk = toNumber(ignoreMaybeArray(router.query.id)) ?? 0;
  const isInvalid = unitPk <= 0;
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl}>
      <LinkPrev />
      {isInvalid ? <ReservationSeriesErrorPage /> : <ReservationSeriesInner unitPk={unitPk} />}
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
