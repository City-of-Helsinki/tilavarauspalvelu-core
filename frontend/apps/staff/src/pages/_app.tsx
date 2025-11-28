import React, { useEffect } from "react";
import type { FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { appWithTranslation } from "next-i18next";
import App from "next/app";
import type { AppContext, AppInitialProps, AppProps } from "next/app";
import type { Router } from "next/router";
import { formatApiDate } from "ui/src/modules/date-utils";
import "ui/src/styles/global.scss";
import { logGraphQLError, logGraphQLQuery, transformQueryError } from "@ui/modules/apollo/helpers";
import { initialiseLogWrite } from "@ui/modules/browserHelpers";
import { PageWrapper } from "@/components/PageWrapper";
import { EnvContextProvider } from "@/context/EnvContext";
import { ModalContextProvider } from "@/context/ModalContext";
import { createClient } from "@/modules/apolloClient";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import type { StaffEnvConfig } from "@/modules/serverUtils";
import {
  BannerNotificationTarget,
  CurrentUserDocument,
  HandlingDataDocument,
  ReservationStateChoice,
  ShowNotificationsListDocument,
} from "@gql/gql-types";
import type {
  CurrentUserQuery,
  CurrentUserQueryVariables,
  HandlingDataQuery,
  HandlingDataQueryVariables,
  ShowNotificationsListQuery,
  ShowNotificationsListQueryVariables,
} from "@gql/gql-types";
import { updateSentryConfig } from "../../instrumentation-client";
import "../styles/global.scss";
import Layout from "./layout";

// suppress useLayoutEffect warnings on SSR till it's fixed upstream in HDS
if (typeof window === "undefined") React.useLayoutEffect = () => {};

function MyApp<T>(props: AppProps<T> & AppOwnProps): JSX.Element {
  const { Component, pageProps, currentUser, handlingData, notificationsData, envConfig } = props;
  const { apiBaseUrl, isConsoleLoggingEnabled, sentryDsn, sentryEnvironment, version } = envConfig;
  useEffect(() => {
    if (sentryDsn) {
      updateSentryConfig(sentryDsn, sentryEnvironment);
    }
  }, [sentryDsn, sentryEnvironment]);

  if (isConsoleLoggingEnabled) {
    initialiseLogWrite();
  }

  // NOTE incorrectly typed (apiBaseUrl can be undefined during build)
  const apolloClient = createClient(apiBaseUrl ?? "");

  // Manual rehydration of currentUser (otherwise we have flashes of unauthenticated state)
  // DO NOT use useEffect / async here
  // React rendering loop
  // -> render the component without currentUser
  // -> run useEffect
  // -> redraw component with currentUser
  if (currentUser) {
    apolloClient.writeQuery({
      query: CurrentUserDocument,
      data: {
        currentUser,
      },
    });
  }
  if (handlingData) {
    apolloClient.writeQuery({
      query: HandlingDataDocument,
      data: handlingData,
    });
  }
  if (notificationsData) {
    apolloClient.writeQuery({
      query: ShowNotificationsListDocument,
      data: notificationsData,
      variables: {
        target: BannerNotificationTarget.Staff,
      },
    });
  }

  return (
    <ApolloProvider client={apolloClient}>
      <EnvContextProvider env={envConfig}>
        <ModalContextProvider>
          <Layout version={version}>
            <PageWrapper>
              <Component {...pageProps} />
            </PageWrapper>
          </Layout>
        </ModalContextProvider>
      </EnvContextProvider>
    </ApolloProvider>
  );
}

function formatUrlPath(router: Router): string {
  return `${router.basePath}${router.pathname}`;
}

type AppOwnProps = {
  currentUser: CurrentUserQuery["currentUser"];
  handlingData: HandlingDataQuery | null;
  notificationsData: ShowNotificationsListQuery | null;
  envConfig: StaffEnvConfig;
};

// Override the data fetching for the whole app
// this is done because we need currentUser and ACL list on every page
// NOTE this is not recommended but the alternative is to migrate to app router
// it disables automatic static page generation (we don't care) but might disable other optimizations
MyApp.getInitialProps = async (context: AppContext): Promise<AppOwnProps & AppInitialProps> => {
  const ctx = await App.getInitialProps(context);

  const commonProps = await getCommonServerSideProps();
  const client = createClient(commonProps.apiBaseUrl, context.ctx.req);

  try {
    const startTime = performance.now();
    const urlPathString = formatUrlPath(context.router);
    const { data } = await client.query<CurrentUserQuery, CurrentUserQueryVariables>({
      query: CurrentUserDocument,
    });
    logGraphQLQuery(performance.now() - startTime, urlPathString, CurrentUserDocument);

    // Need to fetch all data required by the Navigation component otherwise it flashes
    const handlingTime = performance.now();
    const { data: handlingData } = await client.query<HandlingDataQuery, HandlingDataQueryVariables>({
      query: HandlingDataDocument,
      variables: {
        beginDate: formatApiDate(new Date()) ?? "",
        state: ReservationStateChoice.RequiresHandling,
      },
    });
    logGraphQLQuery(performance.now() - handlingTime, urlPathString, HandlingDataDocument);

    const notificationTime = performance.now();
    const { data: notificationsData } = await client.query<
      ShowNotificationsListQuery,
      ShowNotificationsListQueryVariables
    >({
      query: ShowNotificationsListDocument,
      variables: {
        target: BannerNotificationTarget.Staff,
      },
    });
    logGraphQLQuery(performance.now() - notificationTime, urlPathString, ShowNotificationsListDocument);

    return {
      ...ctx,
      envConfig: commonProps,
      currentUser: data.currentUser,
      handlingData,
      notificationsData: notificationsData,
    };
  } catch (err) {
    const error = transformQueryError(err);
    logGraphQLError(error);
  }

  return { ...ctx, envConfig: commonProps, currentUser: null, handlingData: null, notificationsData: null };
};

// NOTE inferred type problem so casting to FC
export default appWithTranslation(MyApp) as FC;
