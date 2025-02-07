import React from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ApplicationRoundsUiDocument,
  type ApplicationRoundsUiQuery,
  type ApplicationRoundsUiQueryVariables,
} from "@gql/gql-types";
import { breakpoints, H1, H2, H3 } from "common";
import { createApolloClient } from "@/modules/apolloClient";
import { Sanitize } from "common/src/components/Sanitize";
import { getTranslation } from "@/modules/util";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";
import { getApplicationRoundPath, seasonalPrefix } from "@/modules/urls";
import { capitalize } from "lodash";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const id = Number(params?.id);
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data } = await apolloClient.query<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >({
    fetchPolicy: "no-cache",
    query: ApplicationRoundsUiDocument,
  });
  const applicationRound = data?.applicationRounds?.edges
    .map((n) => n?.node)
    .find((n) => n?.pk === id);

  const notFound = applicationRound == null;
  return {
    notFound,
    props: {
      ...(notFound ? { notFound } : { applicationRound }),
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

const ContentWrapper = styled.div`
  display: flex;
  gap: var(--spacing-m);
  @media (max-width: ${breakpoints.m}) {
    flex-flow: column-reverse;
  }
`;

const NotesWrapper = styled.div`
  margin-left: 0;
  @media (min-width: ${breakpoints.m}) {
    margin-left: auto;
  }
`;

function Criteria({
  applicationRound,
}: Readonly<PropsNarrowed>): JSX.Element | null {
  const { t } = useTranslation();

  const routes = [
    {
      slug: seasonalPrefix,
      title: t("breadcrumb:recurring"),
    },
    {
      title: getApplicationRoundName(applicationRound),
      slug: getApplicationRoundPath(applicationRound.pk),
    },
    {
      title: t("breadcrumb:criteria"),
    },
  ] as const;

  const title = capitalize(t("applicationRound:criteria"));
  const subtitle = `${getApplicationRoundName(applicationRound)} ${t("applicationRound:criteria")}`;

  return (
    <>
      <Breadcrumb routes={routes} />
      <H1 $noMargin>{title}</H1>
      <H3 as={H2} $noMargin>
        {subtitle}
      </H3>
      <ContentWrapper>
        <Sanitize html={getTranslation(applicationRound, "criteria")} />
        <NotesWrapper>
          <NotesWhenApplying applicationRound={applicationRound} />
        </NotesWrapper>
      </ContentWrapper>
    </>
  );
}

export default Criteria;
