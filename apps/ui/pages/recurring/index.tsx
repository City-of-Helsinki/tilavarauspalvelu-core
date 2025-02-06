import React from "react";
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
import { ApplicationRoundCard } from "@/components/recurring/ApplicationRoundCard";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { Flex } from "common/styles/util";
import { Breadcrumb } from "@/components/common/Breadcrumb";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
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
}

function getDateTime(date: string | Date) {
  return new Date(date).getTime();
}

function RecurringLander({ applicationRounds }: Props): JSX.Element {
  const { t } = useTranslation();

  const activeApplicationRounds = applicationRounds
    .filter((ar) => ar.status === ApplicationRoundStatusChoice.Open)
    .sort(
      (a, b) =>
        getDateTime(b.applicationPeriodEnd) -
        getDateTime(a.applicationPeriodEnd)
    );

  const pendingApplicationRounds = applicationRounds
    .filter((ar) => ar.status === ApplicationRoundStatusChoice.Upcoming)
    .sort(
      (a, b) =>
        getDateTime(a.applicationPeriodBegin) -
        getDateTime(b.applicationPeriodBegin)
    );

  const pastApplicationRounds = applicationRounds
    .filter(
      (ar) =>
        ar.status !== ApplicationRoundStatusChoice.Open &&
        ar.status !== ApplicationRoundStatusChoice.Upcoming
    )
    .sort(
      (a, b) =>
        getDateTime(b.applicationPeriodEnd) -
        getDateTime(a.applicationPeriodEnd)
    );

  const routes = [
    {
      title: t("breadcrumb:recurring"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <div>
        <H1 $noMargin>{t("recurringLander:heading")}</H1>
        <p>{t("recurringLander:subHeading")}</p>
      </div>
      <>
        <Flex data-testid="recurring-lander__application-round-container--active">
          <H2 $noMargin>{t("recurringLander:roundHeadings.active")}</H2>
          {activeApplicationRounds.length > 0 ? null : (
            <p>{t("recurringLander:noRounds")}</p>
          )}
          {activeApplicationRounds.map((applicationRound) => (
            <ApplicationRoundCard
              key={applicationRound.pk}
              applicationRound={applicationRound}
            />
          ))}
        </Flex>
        {pendingApplicationRounds.length > 0 && (
          <Flex data-testid="recurring-lander__application-round-container--pending">
            <H2 $noMargin>{t("recurringLander:roundHeadings.pending")}</H2>
            {pendingApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.pk}
                applicationRound={applicationRound}
              />
            ))}
          </Flex>
        )}
        {pastApplicationRounds.length > 0 && (
          <Flex data-testid="recurring-lander__application-round-container--past">
            <H2 $noMargin>{t("recurringLander:roundHeadings.past")}</H2>
            {pastApplicationRounds.map((applicationRound) => (
              <ApplicationRoundCard
                key={applicationRound.pk}
                applicationRound={applicationRound}
              />
            ))}
          </Flex>
        )}
      </>
    </>
  );
}

export default RecurringLander;
