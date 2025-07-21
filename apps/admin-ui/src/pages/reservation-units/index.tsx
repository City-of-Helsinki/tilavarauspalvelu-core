import React from "react";
import { useTranslation } from "next-i18next";
import { H1, HR } from "common/styled";
import { AuthorizationChecker } from "@/common/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { UserPermissionChoice } from "@gql/gql-types";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { ReservationUnitsDataReader, Filters } from "@lib/reservation-units/";

function ReservationUnits(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("reservationUnit:reservationUnitListHeading")}</H1>
        <p>{t("reservationUnit:reservationUnitListDescription")}</p>
      </div>
      <Filters />
      <HR />
      <ReservationUnitsDataReader />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(props: PageProps): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <ReservationUnits />
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
