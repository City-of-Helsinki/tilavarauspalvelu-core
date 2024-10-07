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
import { breakpoints, Container, H2 } from "common";
import { createApolloClient } from "@/modules/apolloClient";
import Sanitize from "@/components/common/Sanitize";
import { getTranslation } from "@/modules/util";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
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
  const applicationRound =
    data?.applicationRounds?.edges
      .map((n) => n?.node)
      .find((n) => n?.pk === id) ?? null;

  return {
    notFound: applicationRound == null,
    props: {
      ...commonProps,
      key: `${id}${locale}`,
      applicationRound,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const HeadContent = styled.div`
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
`;

const Heading = styled(H2).attrs({ as: "h1" })``;

const ContentWrapper = styled.div`
  display: flex;
  gap: var(--spacing-m);
  @media (max-width: ${breakpoints.m}) {
    flex-flow: column-reverse;
  }
`;

const Content = styled.div`
  max-width: var(--container-width-l);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

const NotesWrapper = styled.div`
  flex-grow: 1;
`;

function Criteria({ applicationRound }: Props): JSX.Element | null {
  const { t } = useTranslation();

  if (!applicationRound) {
    return null;
  }

  return (
    <>
      <div>
        <BreadcrumbWrapper route={["/recurring", "criteria"]} />
        <HeadContent>
          <Heading>
            {`${getApplicationRoundName(applicationRound)} ${t(
              "applicationRound:criteria"
            )}`}
          </Heading>
        </HeadContent>
      </div>
      <Container>
        <ContentWrapper>
          <Content>
            <Sanitize html={getTranslation(applicationRound, "criteria")} />
          </Content>
          <NotesWrapper>
            <NotesWhenApplying applicationRound={applicationRound} />
          </NotesWrapper>
        </ContentWrapper>
      </Container>
    </>
  );
}

export default Criteria;
