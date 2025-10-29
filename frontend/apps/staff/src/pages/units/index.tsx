import React from "react";
import { Link, LinkSize } from "hds-react";
import { H1, HR } from "common/src/styled";
import { useTranslation } from "next-i18next";
import { Filters, UnitsDataLoader } from "@/components/units";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { UserPermissionChoice } from "@gql/gql-types";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

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
export default function Page(props: PageProps): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <Units />
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
