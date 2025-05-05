import React from "react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Flex, H1, H2 } from "common/styled";
import {
  type ApplicationRoundFieldsFragment,
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
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { gql } from "@apollo/client";

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
    variables: {
      orderBy: [ApplicationRoundOrderingChoices.PkAsc],
    },
  });
  const applicationRounds = filterNonNullable(
    data?.applicationRounds?.edges.map((n) => n?.node)
  );

  const filteredApplicationRounds = applicationRounds.filter(
    (applicationRound) =>
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

function RecurringLander({
  applicationRounds,
}: Readonly<Pick<Props, "applicationRounds">>): JSX.Element {
  const { t } = useTranslation();

  const active = applicationRounds
    .filter(isActiveRound)
    .sort((a, b) =>
      compTimeStrings(a.applicationPeriodEnd, b.applicationPeriodEnd)
    );

  const upcoming = applicationRounds
    .filter(isFutureRound)
    .sort((a, b) =>
      compTimeStrings(a.applicationPeriodBegin, b.applicationPeriodBegin)
    );

  const past = applicationRounds
    .filter(isPastRound)
    .sort((a, b) =>
      compTimeStrings(a.applicationPeriodEnd, b.applicationPeriodEnd)
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
          {active.length > 0 ? (
            active.map((round) => (
              <ApplicationRoundCard key={round.pk} applicationRound={round} />
            ))
          ) : (
            <p>{t("recurringLander:noRounds")}</p>
          )}
        </Flex>
        {upcoming.length > 0 && (
          <Flex data-testid="recurring-lander__application-round-container--pending">
            <H2 $noMargin>{t("recurringLander:roundHeadings.pending")}</H2>
            {upcoming.map((round) => (
              <ApplicationRoundCard key={round.pk} applicationRound={round} />
            ))}
          </Flex>
        )}
        {past.length > 0 && (
          <Flex data-testid="recurring-lander__application-round-container--past">
            <H2 $noMargin>{t("recurringLander:roundHeadings.past")}</H2>
            {past.map((round) => (
              <ApplicationRoundCard key={round.pk} applicationRound={round} />
            ))}
          </Flex>
        )}
      </>
    </>
  );
}

function isPastRound(
  round: Pick<ApplicationRoundFieldsFragment, "status">
): boolean {
  return (
    round.status !== ApplicationRoundStatusChoice.Open &&
    round.status !== ApplicationRoundStatusChoice.Upcoming
  );
}

function isFutureRound(
  round: Pick<ApplicationRoundFieldsFragment, "status">
): boolean {
  return round.status === ApplicationRoundStatusChoice.Upcoming;
}

function isActiveRound(
  round: Pick<ApplicationRoundFieldsFragment, "status">
): boolean {
  return round.status === ApplicationRoundStatusChoice.Open;
}

function getDateTime(date: string) {
  return new Date(date).getTime();
}

function compTimeStrings(a: string, b: string) {
  return getDateTime(a) - getDateTime(b);
}

export default RecurringLander;

export const APPLICATION_ROUND_FRAGMENT = gql`
  fragment ApplicationRoundFields on ApplicationRoundNode {
    ...ApplicationRoundCard
    publicDisplayBegin
    publicDisplayEnd
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
    reservationUnits {
      id
      pk
      unit {
        id
        pk
      }
    }
  }
`;

export const APPLICATION_ROUNDS = gql`
  ${APPLICATION_ROUND_FRAGMENT}
  query ApplicationRoundsUi($orderBy: [ApplicationRoundOrderingChoices]) {
    applicationRounds(orderBy: $orderBy) {
      edges {
        node {
          ...ApplicationRoundFields
        }
      }
    }
  }
`;
