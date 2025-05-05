import React from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ApplicationRoundCriteriaDocument,
  type ApplicationRoundCriteriaQuery,
  type ApplicationRoundCriteriaQueryVariables,
} from "@gql/gql-types";
import { H1, H2, H3 } from "common/styled";
import { breakpoints } from "common/src/const";
import { createApolloClient } from "@/modules/apolloClient";
import { Sanitize } from "common/src/components/Sanitize";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";
import { getApplicationRoundPath, seasonalPrefix } from "@/modules/urls";
import {
  base64encode,
  capitalize,
  ignoreMaybeArray,
  toNumber,
} from "common/src/helpers";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";
import { gql } from "@apollo/client";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

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
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const name = getTranslationSafe(applicationRound.nameTranslations, lang);

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
  const criteria = getTranslationSafe(
    applicationRound.criteriaTranslations,
    lang
  );

  return (
    <>
      <Breadcrumb routes={routes} />
      <H1 $noMargin>{title}</H1>
      <H3 as={H2} $noMargin>
        {subtitle}
      </H3>
      <ContentWrapper>
        <Sanitize html={criteria} />
        <NotesWrapper>
          <NotesWhenApplying applicationRound={applicationRound} />
        </NotesWrapper>
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
  const { data } = await apolloClient.query<
    ApplicationRoundCriteriaQuery,
    ApplicationRoundCriteriaQueryVariables
  >({
    query: ApplicationRoundCriteriaDocument,
    variables: {
      id: base64encode(`ApplicationRoundNode:${pk}`),
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
      nameTranslations {
        fi
        en
        sv
      }
      criteriaTranslations {
        fi
        en
        sv
      }
      notesWhenApplyingTranslations {
        fi
        en
        sv
      }
    }
  }
`;
