import React from "react";
import { useTranslation } from "next-i18next";
import { ResourceEditor } from "@/component/unit/ResourceEditor";
import { useRouter } from "next/router";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { AuthorizationChecker } from "@/common/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";

function ResourceEditorView(): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const unitPk = toNumber(ignoreMaybeArray(router.query.id));
  const resourcePk = toNumber(ignoreMaybeArray(router.query.pk));

  if (!resourcePk) {
    return <>{t("ResourceEditorView.illegalResource")}</>;
  }

  if (!unitPk) {
    return <>{t("ResourceEditorView.illegalUnit")}</>;
  }

  return <ResourceEditor resourcePk={resourcePk} unitPk={unitPk} />;
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
export default function Page(props: PageProps): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl}>
      <ResourceEditorView />
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
