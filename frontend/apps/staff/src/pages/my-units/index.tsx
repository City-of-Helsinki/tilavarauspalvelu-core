import React from "react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1 } from "ui/src/styled";
import { Filters, UnitsDataLoader } from "@/components/units";

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(_props: PageProps): JSX.Element {
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

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
