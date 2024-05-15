import React from "react";
import { useTranslation } from "next-i18next";
import type { GetServerSidePropsContext } from "next";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { Query, QueryApplicationRoundsArgs } from "@gql/gql-types";
import { Container } from "common";
import { createApolloClient } from "@/modules/apolloClient";
import Sanitize from "@/components/common/Sanitize";
import KorosDefault from "@/components/common/KorosDefault";
import { getTranslation } from "@/modules/util";
import { APPLICATION_ROUNDS } from "@/modules/queries/applicationRound";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { getApplicationRoundName } from "@/modules/applicationRound";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, params } = ctx;
  const id = Number(params?.id);
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data } = await apolloClient.query<Query, QueryApplicationRoundsArgs>({
    fetchPolicy: "no-cache",
    query: APPLICATION_ROUNDS,
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

const Head = styled.div`
  background-color: var(--tilavaraus-hero-background-color);
  color: var(--color-white);
`;

const HeadContent = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-l);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  font-size: var(--fontsize-body-xl);
`;

const H1 = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const Content = styled.div`
  max-width: var(--container-width-l);
  font-family: var(--font-regular);
  font-size: var(--fontsize-body-l);
`;

const Criteria = ({ applicationRound }: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (!applicationRound) {
    return null;
  }

  return (
    <>
      <Head>
        <BreadcrumbWrapper route={["/recurring", "criteria"]} />
        <HeadContent>
          <H1>
            {`${getApplicationRoundName(applicationRound)} ${t(
              "applicationRound:criteria"
            )}`}
          </H1>
        </HeadContent>
        <KorosDefault />
      </Head>
      <Container>
        <Content>
          <Sanitize html={getTranslation(applicationRound, "criteria") || ""} />
        </Content>
      </Container>
    </>
  );
};

export default Criteria;
