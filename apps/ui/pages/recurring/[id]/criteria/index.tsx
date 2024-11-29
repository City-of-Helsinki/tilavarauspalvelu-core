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
import { breakpoints, H1 } from "common";
import { createApolloClient } from "@/modules/apolloClient";
import Sanitize from "@/components/common/Sanitize";
import { getTranslation } from "@/modules/util";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const id = Number(params?.id);
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  // TODO use a singular query for this
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
};

const ContentWrapper = styled.div`
  display: flex;
  gap: var(--spacing-m);
  @media (max-width: ${breakpoints.m}) {
    flex-flow: column-reverse;
  }
`;

function Criteria({ applicationRound }: PropsNarrowed): JSX.Element | null {
  const { t } = useTranslation();

  const title = `${getApplicationRoundName(applicationRound)} ${t("applicationRound:criteria")}`;
  return (
    <>
      <BreadcrumbWrapper route={["/recurring", "criteria"]} />
      <H1 $noMargin>{title}</H1>
      <ContentWrapper>
        <Sanitize html={getTranslation(applicationRound, "criteria")} />
        <NotesWhenApplying applicationRound={applicationRound} />
      </ContentWrapper>
    </>
  );
}

export default Criteria;
