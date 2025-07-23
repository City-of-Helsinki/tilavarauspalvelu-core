import React from "react";
import { useTranslation } from "next-i18next";
import { H1 } from "common/styled";
import { Filters, UnitsDataLoader } from "@/component/units";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";

export function MyUnits() {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("myUnits:heading")}</H1>
        <p>{t("myUnits:description")}</p>
      </div>
      <Filters />
      <UnitsDataLoader isMyUnits />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(props: PageProps): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl}>
      <MyUnits />
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
