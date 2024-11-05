import React from "react";
import styled from "styled-components";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { H1, H2 } from "common/src/common/typography";
import {
  ApplicationRoundOrderingChoices,
  ApplicationRoundStatusChoice,
  ApplicationRoundsUiDocument,
  type ApplicationRoundsUiQuery,
  type ApplicationRoundsUiQueryVariables,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { HeroSubheading } from "@/modules/style/typography";
import { ApplicationRoundCard } from "@/components/recurring/ApplicationRoundCard";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const now = new Date();
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { data } = await apolloClient.query<
    ApplicationRoundsUiQuery,
    ApplicationRoundsUiQueryVariables
  >({
    query: ApplicationRoundsUiDocument,
    fetchPolicy: "no-cache",
    variables: {
      orderBy: [ApplicationRoundOrderingChoices.PkAsc],
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
      ...commonProps,
      applicationRounds: filteredApplicationRounds,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const RoundList = styled.div`
  display: flex;
  flex-flow: column nowrap;
  gap: var(--spacing-m);
  margin-bottom: var(--spacing-layout-m);
  :last-child {
    margin-bottom: 0;
  }
`;

function RecurringLander({ applicationRounds }: Props): JSX.Element {
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
    <>
      <div>
        <H1 $marginTop="l" $marginBottom="none">
          {t("recurringLander:heading")}
        </H1>
        <HeroSubheading>{t("recurringLander:subHeading")}</HeroSubheading>
      </div>
      <>
        {activeApplicationRounds.length > 0 ? (
          <RoundList data-testid="recurring-lander__application-round-container--active">
            <H2 $noMargin>{t("recurringLander:roundHeadings.active")}</H2>
            {activeApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.pk}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        ) : (
          <RoundList data-testid="recurring-lander__application-round-container--active-empty">
            <H2 $noMargin>{t("recurringLander:roundHeadings.active")}</H2>
            {t("recurringLander:noRounds")}
          </RoundList>
        )}
        {pendingApplicationRounds.length > 0 && (
          <RoundList data-testid="recurring-lander__application-round-container--pending">
            <H2 $noMargin>{t("recurringLander:roundHeadings.pending")}</H2>
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
            <H2 $noMargin>{t("recurringLander:roundHeadings.past")}</H2>
            {pastApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.pk}
                applicationRound={applicationRound}
              />
            ))}
          </RoundList>
        )}
      </>
    </>
  );
}

export default RecurringLander;
