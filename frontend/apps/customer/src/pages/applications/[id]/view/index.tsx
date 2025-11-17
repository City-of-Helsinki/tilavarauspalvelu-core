import React from "react";
import { gql } from "@apollo/client";
import { Tabs } from "hds-react";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import styled from "styled-components";
import { useToastIfQueryParam } from "ui/src/hooks";
import { formatDateTime } from "ui/src/modules/date-utils";
import { createNodeId, getLocalizationLang, getTranslation, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import { Flex } from "ui/src/styled";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ApplicationHead } from "@/components/application/ApplicationHead";
import { ApplicationTerms } from "@/components/application/ApplicationTerms";
import { ApprovedReservations, BREAKPOINT } from "@/components/application/ApprovedReservations";
import { ViewApplication } from "@/components/application/view/ViewApplication";
import { createApolloClient } from "@/modules/apolloClient";
import { getCommonServerSideProps, getGenericTerms } from "@/modules/serverUtils";
import { applicationsPrefix } from "@/modules/urls";
import {
  ApplicationStatusChoice,
  ApplicationViewDocument,
  type ApplicationViewQueryVariables,
  type ApplicationViewQuery,
} from "@gql/gql-types";

const TabPanel = styled(Tabs.TabPanel)`
  && {
    margin-top: var(--spacing-l);
    @media (min-width: ${BREAKPOINT}) {
      margin-top: var(--spacing-xl);
    }
  }
`;

function View({ application, tos }: Readonly<Pick<PropsNarrowed, "application" | "tos">>): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  type TabOptions = "reservations" | "application";

  useToastIfQueryParam({
    key: "deletedReservationPk",
    message: t("application:preview.reservationDeleted"),
  });

  const translateDeletedSectionMessage = () => {
    const { query } = router;
    if (query.cancelled && query.future) {
      const cancelled = toNumber(ignoreMaybeArray(query.cancelled));
      const future = toNumber(ignoreMaybeArray(query.future));
      if (cancelled != null && cancelled === future) {
        return t("application:preview.applicationSectionCancelledAll", {
          cancelled,
        });
      } else if (cancelled != null && future != null) {
        return t("application:preview.applicationSectionCancelled", {
          cancelled,
          future,
        });
      }
    }
    return "Unknown error";
  };

  useToastIfQueryParam({
    key: ["cancelled", "future"],
    message: translateDeletedSectionMessage,
  });

  const searchParams = useSearchParams();

  const handleRouteChange = (query: URLSearchParams) => {
    // [id] param is not included in the URLSearchParams object but required when routing
    if (router.query.id) {
      query.set("id", router.query.id as string);
    }
    router.replace({ query: query.toString() }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  const handleTabChange = (tab_: TabOptions) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab_);
    handleRouteChange(params);
  };

  const tab = searchParams.get("tab") === "application" ? "application" : "reservations";

  const { applicationRound } = application;
  const lang = getLocalizationLang(i18n.language);
  const applicationRoundName = getTranslation(applicationRound, "name", lang);
  const { sentAt } = applicationRound;
  const handledAt = sentAt ? new Date(sentAt) : new Date();
  const showReservations =
    application.status === ApplicationStatusChoice.ResultsSent &&
    application.applicationSections?.some((section) => section.hasReservations);

  const routes = [
    {
      slug: applicationsPrefix,
      title: t("breadcrumb:applications"),
    },
    {
      title: t("breadcrumb:application"),
    },
  ] as const;

  const subTitle = showReservations
    ? `${t("application:view.handledAt")} ${formatDateTime(handledAt, { includeWeekday: false, t, locale: lang })}`
    : undefined;
  return (
    <>
      <Breadcrumb routes={routes} />
      <ApplicationHead title={applicationRoundName} status={application.status} />
      <p style={{ marginTop: 0 }}>{subTitle}</p>
      {showReservations ? (
        <Tabs initiallyActiveTab={tab === "application" ? 1 : 0}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("reservations")}>{t("application:view.reservations")}</Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("application")}>{t("application:view.application")}</Tabs.Tab>
          </Tabs.TabList>
          <TabPanel>
            <ApprovedReservations application={application} applicationRound={applicationRound} />
          </TabPanel>
          <TabPanel>
            <Flex $gap="l">
              <WrappedViewApplication application={application} tos={tos} />
            </Flex>
          </TabPanel>
        </Tabs>
      ) : (
        <WrappedViewApplication application={application} tos={tos} />
      )}
    </>
  );
}

function WrappedViewApplication({ application, tos }: Readonly<Pick<PropsNarrowed, "application" | "tos">>) {
  return (
    <ViewApplication application={application}>
      <ApplicationTerms generalTos={tos} serviceTos={application.applicationRound?.termsOfUse} />
    </ViewApplication>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const { apiBaseUrl } = getCommonServerSideProps();
  const apolloClient = createApolloClient(apiBaseUrl, ctx);

  const { query } = ctx;
  const pk = toNumber(ignoreMaybeArray(query.id));

  const notFound = {
    props: {
      notFound: true,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
    notFound: true,
  };

  if (pk == null || pk <= 0) {
    return notFound;
  }

  const { data } = await apolloClient.query<ApplicationViewQuery, ApplicationViewQueryVariables>({
    query: ApplicationViewDocument,
    variables: { id: createNodeId("ApplicationNode", pk) },
  });

  const { application } = data;
  if (application == null) {
    return notFound;
  }

  const tos = await getGenericTerms(apolloClient);

  return {
    props: {
      application,
      tos,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default View;

export const APPLICATION_VIEW_QUERY = gql`
  query ApplicationView($id: ID!) {
    application(id: $id) {
      ...ApplicationView
      applicationSections {
        id
        hasReservations
      }
    }
  }
`;
