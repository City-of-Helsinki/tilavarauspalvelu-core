import React from "react";
import { useTranslation } from "next-i18next";
import { getTranslationSafe } from "common/src/common/util";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { createApolloClient } from "@/modules/apolloClient";
import { ViewApplication } from "@/components/application/ViewApplication";
import { ApplicationHead } from "@/components/application/ApplicationHead";
import {
  getCommonServerSideProps,
  getGenericTerms,
} from "@/modules/serverUtils";
import {
  base64encode,
  getLocalizationLang,
  ignoreMaybeArray,
  toNumber,
} from "common/src/helpers";
import {
  ApplicationStatusChoice,
  ApplicationViewDocument,
  type ApplicationViewQueryVariables,
  type ApplicationViewQuery,
} from "@gql/gql-types";
import { Tabs } from "hds-react";
import { formatDateTime } from "@/modules/util";
import {
  ApprovedReservations,
  BREAKPOINT,
} from "@/components/application/ApprovedReservations";
import { gql } from "@apollo/client";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import styled from "styled-components";
import { useToastIfQueryParam } from "@/hooks";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { applicationsPrefix } from "@/modules/urls";

const TabPanel = styled(Tabs.TabPanel)`
  && {
    margin-top: var(--spacing-l);
    @media (min-width: ${BREAKPOINT}) {
      margin-top: var(--spacing-xl);
    }
  }
`;

function View({
  application,
  tos,
}: Readonly<Pick<PropsNarrowed, "application" | "tos">>): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  type TabOptions = "reservations" | "application";

  useToastIfQueryParam({
    key: "deletedReservationPk",
    successMessage: t("application:preview.reservationDeleted"),
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
    successMessage: translateDeletedSectionMessage,
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

  const tab =
    searchParams.get("tab") === "application" ? "application" : "reservations";

  const { applicationRound } = application;
  const lang = getLocalizationLang(i18n.language);
  const applicationRoundName = getTranslationSafe(
    applicationRound,
    "name",
    lang
  );
  const { sentDate } = applicationRound;
  const handledDate = sentDate ? new Date(sentDate) : new Date();
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
    ? `${t("application:view.handledDate")} ${formatDateTime(t, handledDate, false)}`
    : undefined;
  return (
    <>
      <Breadcrumb routes={routes} />
      <ApplicationHead
        title={applicationRoundName}
        subTitle={subTitle}
        status={application.status}
      />
      {showReservations ? (
        <Tabs initiallyActiveTab={tab === "application" ? 1 : 0}>
          <Tabs.TabList>
            <Tabs.Tab onClick={() => handleTabChange("reservations")}>
              {t("application:view.reservations")}
            </Tabs.Tab>
            <Tabs.Tab onClick={() => handleTabChange("application")}>
              {t("application:view.application")}
            </Tabs.Tab>
          </Tabs.TabList>
          <TabPanel>
            <ApprovedReservations application={application} />
          </TabPanel>
          <TabPanel>
            <ViewApplication application={application} tos={tos} />
          </TabPanel>
        </Tabs>
      ) : (
        <ViewApplication application={application} tos={tos} />
      )}
    </>
  );
}

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<Props, { notFound: boolean }>;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;
  const commonProps = getCommonServerSideProps();
  const apolloClient = createApolloClient(commonProps.apiBaseUrl, ctx);

  const { query } = ctx;
  const pk = toNumber(ignoreMaybeArray(query.id));

  const notFound = {
    props: {
      notFound: true,
      ...commonProps,
    },
    notFound: true,
  };

  if (pk == null || pk <= 0) {
    return notFound;
  }

  const { data } = await apolloClient.query<
    ApplicationViewQuery,
    ApplicationViewQueryVariables
  >({
    query: ApplicationViewDocument,
    variables: { id: base64encode(`ApplicationNode:${pk}`) },
  });

  const { application } = data;
  if (application == null) {
    return notFound;
  }

  const tos = await getGenericTerms(apolloClient);

  return {
    props: {
      ...commonProps,
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
