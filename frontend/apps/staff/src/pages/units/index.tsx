import React from "react";
import { Link, LinkSize } from "hds-react";
import { type GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1, HR } from "ui/src/styled";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { Filters, UnitsDataLoader } from "@/components/units";
import { UserPermissionChoice } from "@gql/gql-types";

function Units(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("navigation:units")}</H1>
        <p>
          {t("units:description")}
          <Link size={LinkSize.Medium} href={t("units:descriptionLinkHref")} openInNewTab external>
            {t("units:descriptionLinkLabel")}
          </Link>
        </p>
      </div>
      <Filters />
      <HR />
      <UnitsDataLoader />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(_props: PageProps): JSX.Element {
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
