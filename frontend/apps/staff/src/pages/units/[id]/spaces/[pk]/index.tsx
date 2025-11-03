import React from "react";
import { SpaceEditor } from "@lib/units/[id]/spaces/[pk]/SpaceEditor";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { UserPermissionChoice } from "@gql/gql-types";

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page({ apiBaseUrl, spacePk, unitPk }: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <SpaceEditor space={spacePk} unit={unitPk} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const unitPk = toNumber(ignoreMaybeArray(query.id));
  const spacePk = toNumber(ignoreMaybeArray(query.pk));

  if (unitPk == null || unitPk <= 0 || spacePk == null || spacePk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  return {
    props: {
      unitPk,
      spacePk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
