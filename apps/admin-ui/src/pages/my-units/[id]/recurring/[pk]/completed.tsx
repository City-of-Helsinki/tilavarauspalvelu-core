import React from "react";
import { useTranslation } from "next-i18next";
import { ErrorBoundary } from "react-error-boundary";
import { ReservationSeriesView } from "@/component/ReservationSeriesView";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { getMyUnitUrl, getReservationUrl } from "@/common/urls";
import { Flex, H1 } from "common/styled";
import { useReservationSeries } from "@/hooks";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { UserPermissionChoice } from "@gql/gql-types";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";

function ReservationSeriesDoneInner({ recurringPk }: { recurringPk: number }) {
  const { t } = useTranslation("myUnits", {
    keyPrefix: "ReservationSeries.Confirmation",
  });

  const { reservations } = useReservationSeries(recurringPk);
  const reservationUrl = getReservationUrl(reservations[0]?.pk);
  const unitPk = reservations[0]?.reservationUnit.unit.pk;
  const backUrl = getMyUnitUrl(unitPk);

  return (
    <>
      <H1 $marginBottom="none">{reservations.length > 0 ? t(`title`) : t("allFailedTitle")}</H1>
      <p>{t(`successInfo`)}</p>
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
export default function Page(props: PropsNarrowed) {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanCreateStaffReservations}>
      <ErrorBoundary FallbackComponent={ErrorComponent}>
        <ReservationSeriesDoneInner recurringPk={props.pk} />
      </ErrorBoundary>
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ query, locale }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.pk)) ?? 0;
  if (pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  return {
    props: {
      pk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
