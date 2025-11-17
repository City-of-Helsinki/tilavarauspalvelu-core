import React from "react";
import { ResourceEditor } from "@lib/units/[id]/resources/[pk]/ResourceEditor";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { AuthorizationChecker } from "@/components/AuthorizationChecker";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { UserPermissionChoice } from "@gql/gql-types";

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page(props: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker permission={UserPermissionChoice.CanManageReservationUnits}>
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
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
