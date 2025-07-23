import React from "react";
import { useTranslation } from "next-i18next";
import { ErrorBoundary } from "react-error-boundary";
import { ReservationSeriesView } from "@/component/ReservationSeriesView";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { getReservationUrl } from "@/common/urls";
import { Flex, H1 } from "common/styled";
import { useReservationSeries } from "@/hooks";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { UserPermissionChoice } from "@gql/gql-types";
import { useRouter } from "next/router";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";

function ReservationSeriesDoneInner({ recurringPk }: { recurringPk: number }) {
  const { t } = useTranslation("myUnits", {
    keyPrefix: "ReservationSeries.Confirmation",
  });

  const { reservations } = useReservationSeries(recurringPk);
  const reservationUrl = getReservationUrl(reservations[0]?.pk);

  return (
    <>
      <H1 $marginBottom="none">{reservations.length > 0 ? t(`title`) : t("allFailedTitle")}</H1>
      <p>{t(`successInfo`)}</p>
      <ReservationSeriesView reservationSeriesPk={recurringPk} />
      <Flex $direction="row" $justifyContent="flex-end" $wrap="wrap">
        <ButtonLikeLink href="..">{t(`buttonToUnit`)}</ButtonLikeLink>
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
export default function Page(props: PageProps) {
  const router = useRouter();
  // TODO handle invalid or missing id
  const pk = toNumber(ignoreMaybeArray(router.query.pk)) ?? 0;
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanCreateStaffReservations}>
      <ErrorBoundary FallbackComponent={ErrorComponent}>
        <ReservationSeriesDoneInner recurringPk={pk} />
      </ErrorBoundary>
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
