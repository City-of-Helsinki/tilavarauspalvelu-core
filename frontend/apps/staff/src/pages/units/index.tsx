import React from "react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next/pages";
import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import { H1, HR } from "ui/src/styled";
import { UserPermissionChoice } from "@gql/gql-types";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { ExternalLink } from "@/components/ExternalLink";
import { Filters, UnitsDataLoader } from "@/components/units";

function Units(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("navigation:units")}</H1>
        <p>
          {t("units:description")}{" "}
          <ExternalLink href={t("units:descriptionLinkHref")}>{t("units:descriptionLinkLabel")}</ExternalLink>
        </p>
      </div>
      <Filters />
      <HR />
      <UnitsDataLoader />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(_props: PageProps): React.ReactElement {
  return (
    <AuthorizationChecker permission={UserPermissionChoice.CanManageReservationUnits}>
      <Units />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
