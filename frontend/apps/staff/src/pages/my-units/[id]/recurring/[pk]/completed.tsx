import React from "react";
import { useTranslation } from "next-i18next";
import { ErrorBoundary } from "react-error-boundary";
import { ReservationSeriesView } from "@/components/ReservationSeriesView";
import { ButtonLikeLink } from "@/components/ButtonLikeLink";
import { getMyUnitUrl, getReservationUrl } from "@/modules/urls";
import { Flex, H1, P } from "ui/src/styled";
import { useReservationSeries } from "@/hooks";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { UserPermissionChoice } from "@gql/gql-types";
import { ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";

function ReservationSeriesDoneInner({ recurringPk }: { recurringPk: number }) {
  const { t } = useTranslation("myUnits", {
    keyPrefix: "ReservationSeries.Confirmation",
  });

  const { reservations, loading } = useReservationSeries(recurringPk);
  const reservationUrl = getReservationUrl(reservations[0]?.pk);
  const unitPk = reservations[0]?.reservationUnit.unit.pk;
  const backUrl = getMyUnitUrl(unitPk);

  const title = loading || reservations.length > 0 ? t(`title`) : t("allFailedTitle");
  return (
    <>
      <H1 $marginTop="l" $marginBottom="none">
        {title}
      </H1>
      <P $noMargin>{t(`successInfo`)}</P>
      <ReservationSeriesView reservationSeriesPk={recurringPk} />
      <Flex $direction="row" $justifyContent="flex-end" $wrap="wrap">
        <ButtonLikeLink href={backUrl}>{t(`buttonToUnit`)}</ButtonLikeLink>
        <ButtonLikeLink disabled={reservationUrl === ""} href={reservationUrl}>
          {t(`buttonToReservation`)}
        </ButtonLikeLink>
      </Flex>
    </>
  );
}

function ErrorComponent() {
  const { t } = useTranslation();
  return <div>{t("errors:errorReservationSeriesDoneDisplay")}</div>;
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page({ apiBaseUrl, pk, unitPk }: PropsNarrowed) {
  return (
    <AuthorizationChecker
      apiUrl={apiBaseUrl}
      permission={UserPermissionChoice.CanCreateStaffReservations}
      unitPk={unitPk}
    >
      <ErrorBoundary FallbackComponent={ErrorComponent}>
        <ReservationSeriesDoneInner recurringPk={pk} />
      </ErrorBoundary>
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ query, locale }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.pk)) ?? 0;
  const unitPk = toNumber(ignoreMaybeArray(query.id)) ?? 0;
  if (pk <= 0 || unitPk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  return {
    props: {
      pk,
      unitPk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
