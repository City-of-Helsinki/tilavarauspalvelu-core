import React from "react";
import styled from "styled-components";
import { GetServerSideProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H2, H3 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  type ApplicationRoundNode,
  ApplicationRoundStatusChoice,
  type Query,
  type QueryApplicationRoundsArgs,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { HeroSubheading } from "@/modules/style/typography";
import ApplicationRoundCard from "@/components/index/ApplicationRoundCard";
import KorosDefault from "@/components/common/KorosDefault";
import { createApolloClient } from "@/modules/apolloClient";
import { APPLICATION_ROUNDS } from "@/modules/queries/applicationRound";
import BreadcrumbWrapper from "@/components/common/BreadcrumbWrapper";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = {
  applicationRounds: ApplicationRoundNode[];
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const now = new Date();
  const { locale } = ctx;
  const apolloClient = createApolloClient(ctx);

  const { data } = await apolloClient.query<Query, QueryApplicationRoundsArgs>({
    query: APPLICATION_ROUNDS,
    fetchPolicy: "no-cache",
    variables: {
      orderBy: "pk",
    },
  });
  const applicationRounds = filterNonNullable(
    data?.applicationRounds?.edges.map((n) => n?.node)
  );

  const filteredApplicationRounds = applicationRounds.filter(
    (applicationRound) =>
      applicationRound?.publicDisplayBegin &&
      applicationRound?.publicDisplayEnd &&
      new Date(applicationRound.publicDisplayBegin) <= now &&
      new Date(applicationRound.publicDisplayEnd) >= now
  );

  return {
    props: {
      ...getCommonServerSideProps(),
      applicationRounds: filteredApplicationRounds,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const HeadWrapper = styled.div`
  background-color: var(--tilavaraus-hero-background-color);
  color: var(--color-white);
`;

const Head = styled.div`
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-xl);

  @media (min-width: ${breakpoints.m}) {
    max-width: var(--container-width-xl);
    padding: var(--spacing-m);
    margin: 0 auto;
    padding-bottom: var(--spacing-layout-l);
  }
`;

const Content = styled.div`
  padding: 0 var(--spacing-m) var(--spacing-xl);
  background-color: var(--color-white);

  @media (min-width: ${breakpoints.m}) {
    max-width: var(--container-width-xl);
    margin: 0 auto;
    padding-bottom: var(--spacing-layout-xl);
  }
`;

const RoundList = styled.div`
  margin-bottom: var(--spacing-layout-l);
`;

const RoundHeading = styled(H3).attrs({ as: "h2" })`
  margin-top: 0;
  margin-bottom: var(--spacing-m);
`;

const RecurringLander = ({ applicationRounds }: Props): JSX.Element => {
  const { t } = useTranslation();

  const activeApplicationRounds = applicationRounds.filter(
    (ar) => ar.status === ApplicationRoundStatusChoice.Open
  );

  const pendingApplicationRounds = applicationRounds.filter(
    (ar) => ar.status === ApplicationRoundStatusChoice.Upcoming
  );

  const pastApplicationRounds = applicationRounds.filter(
    (ar) =>
      ar.status !== ApplicationRoundStatusChoice.Open &&
      ar.status !== ApplicationRoundStatusChoice.Upcoming
  );

  return (
    <div>
      <BreadcrumbWrapper route={["recurring"]} />
      <HeadWrapper>
        <Head>
          <H2 as="h1">{t("recurringLander:heading")}</H2>
          <HeroSubheading>{t("recurringLander:subHeading")}</HeroSubheading>
        </Head>
      </HeadWrapper>
      <KorosDefault />
      <Content>
        {activeApplicationRounds.length > 0 ? (
          <RoundList data-testid="recurring-lander__application-round-container--active">
            <RoundHeading>
              {t("recurringLander:roundHeadings.active")}
            </RoundHeading>
            {activeApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.pk}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        ) : (
          <RoundList data-testid="recurring-lander__application-round-container--active-empty">
            <RoundHeading>
              {t("recurringLander:roundHeadings.active")}
            </RoundHeading>
            {t("recurringLander:noRounds")}
          </RoundList>
        )}
        {pendingApplicationRounds.length > 0 && (
          <RoundList data-testid="recurring-lander__application-round-container--pending">
            <RoundHeading>
              {t("recurringLander:roundHeadings.pending")}
            </RoundHeading>
            {pendingApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.pk}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        )}
        {pastApplicationRounds.length > 0 && (
          <RoundList data-testid="recurring-lander__application-round-container--past">
            <RoundHeading>
              {t("recurringLander:roundHeadings.past")}
            </RoundHeading>
            {pastApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.pk}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        )}
      </Content>
    </div>
  );
};

export default RecurringLander;
