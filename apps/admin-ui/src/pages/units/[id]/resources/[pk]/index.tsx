import React from "react";
import { ResourceEditor } from "@lib/units/[id]/resources/[pk]/ResourceEditor";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";
import { UserPermissionChoice } from "@gql/gql-types";

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page(props: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <ResourceEditor resourcePk={props.resourcePk} unitPk={props.unitPk} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const unitPk = toNumber(ignoreMaybeArray(query.id));
  const resourcePk = toNumber(ignoreMaybeArray(query.pk));

  if (unitPk == null || unitPk <= 0 || resourcePk == null || resourcePk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      unitPk,
      resourcePk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
