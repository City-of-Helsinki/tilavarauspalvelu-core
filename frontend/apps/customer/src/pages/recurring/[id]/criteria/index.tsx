import React from "react";
import { gql } from "@apollo/client";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { Sanitize } from "@ui/components/Sanitize";
import { breakpoints } from "@ui/modules/const";
import {
  createNodeId,
  capitalize,
  ignoreMaybeArray,
  toNumber,
  getLocalizationLang,
  getTranslation,
} from "@ui/modules/helpers";
import { Flex, H1 } from "@ui/styled";
import { Breadcrumb } from "@/components/Breadcrumb";
import { NotesWhenApplying } from "@/components/application";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { getApplicationRoundPath, seasonalPrefix } from "@/modules/urls";
import {
  ApplicationRoundCriteriaDocument,
  type ApplicationRoundCriteriaQuery,
  type ApplicationRoundCriteriaQueryVariables,
} from "@gql/gql-types";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

const ContentWrapper = styled.div`
  display: grid;
  gap: 1em;
  grid-template-rows: repeat(4, auto);
  grid-template-columns: 1fr;

  :first-child {
    grid-column-start: 1;
    grid-row-start: 1;
  }
  :nth-child(2) {
    grid-row: 3 / -1;
    grid-column-start: 1;
  }
  :nth-child(3) {
    grid-row-start: 2;
  }
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 21em;
    :nth-child(2) {
      grid-row-start: 2;
      grid-column-start: 1;
    }
  }
`;

function Criteria({ applicationRound }: Readonly<PropsNarrowed>): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
  const name = getTranslation(applicationRound, "name", lang);

  const routes = [
    {
      slug: seasonalPrefix,
      title: t("breadcrumb:recurring"),
    },
    {
      title: name,
      slug: getApplicationRoundPath(applicationRound.pk),
    },
    {
      title: t("breadcrumb:criteria"),
    },
  ] as const;

  const title = capitalize(t("applicationRound:criteria"));
  const subtitle = `${name} ${t("applicationRound:criteria")}`;
  const criteria = getTranslation(applicationRound, "criteria", lang);

  return (
    <>
      <Breadcrumb routes={routes} />
      <ContentWrapper>
        <Flex $gap="none">
          <H1 $noMargin>{title}</H1>
          <p>{subtitle}</p>
        </Flex>
        <Sanitize html={criteria} />
        <NotesWhenApplying applicationRound={applicationRound} />
      </ContentWrapper>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale, params } = ctx;
  const pk = toNumber(ignoreMaybeArray(params?.id));
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const notFound = {
    notFound: true,
    props: {
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
      notFound: true,
    },
  };

  if (pk == null || !(pk > 0)) {
    return notFound;
  }
  const { data } = await apolloClient.query<ApplicationRoundCriteriaQuery, ApplicationRoundCriteriaQueryVariables>({
    query: ApplicationRoundCriteriaDocument,
    variables: {
      id: createNodeId("ApplicationRoundNode", pk),
    },
  });

  const { applicationRound } = data;
  if (applicationRound == null) {
    return notFound;
  }
  return {
    props: {
      ...commonProps,
      applicationRound,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Criteria;

export const APPLICATION_ROUND_CRITERIA_QUERY = gql`
  query ApplicationRoundCriteria($id: ID!) {
    applicationRound(id: $id) {
      pk
      id
      nameFi
      nameEn
      nameSv
      criteriaFi
      criteriaEn
      criteriaSv
      notesWhenApplyingFi
      notesWhenApplyingEn
      notesWhenApplyingSv
    }
  }
`;
