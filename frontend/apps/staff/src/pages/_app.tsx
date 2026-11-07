import React, { useState } from "react";
import type { FC } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { appWithTranslation } from "next-i18next/pages";
import App from "next/app";
import type { AppContext, AppInitialProps, AppProps } from "next/app";
import type { Router } from "next/router";
import { ErrorContainer } from "@ui/components";
import { ErrorTrigger, triggerServerError } from "@ui/components/ErrorTrigger";
import { isRequestError } from "@ui/modules/apollo/errors";
import { logGraphQLQuery } from "@ui/modules/apollo/helpers";
import "ui/src/styles/global.scss";
import { initialiseLogWrite } from "@ui/modules/browserHelpers";
import { logError } from "@ui/modules/errors";
import {
  BannerNotificationTarget,
  CurrentUserDocument,
  HandlingDataDocument,
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
import { Layout } from "@/components/Layout";
import { PageWrapper } from "@/components/PageWrapper";
import { EnvContextProvider } from "@/context/EnvContext";
import { ModalContextProvider } from "@/context/ModalContext";
import { getHandlingDataVariables } from "@/hooks/useHandling";
import { createClient } from "@/modules/apolloClient";
import { PUBLIC_URL } from "@/modules/const";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import "../styles/global.scss";
import type { StaffEnvConfig } from "@/modules/serverUtils";

// suppress useLayoutEffect warnings on SSR till it's fixed upstream in HDS
if (typeof window === "undefined") React.useLayoutEffect = () => {};

function MyApp<T>(props: AppProps<T> & AppOwnProps): React.ReactElement {
  const { Component, pageProps, isBackendError, currentUser, handlingData, notificationsData, envConfig } = props;
  const { apiBaseUrl, isConsoleLoggingEnabled, version } = envConfig;

  if (isConsoleLoggingEnabled) {
    initialiseLogWrite();
  }

  // NOTE incorrectly typed (apiBaseUrl can be undefined during build)
  // Keep one client, otherwise every render drops the cache and fetches all active queries again
  const [apolloClient] = useState(() => createClient(apiBaseUrl ?? ""));

  // Manual rehydration of currentUser (otherwise we have flashes of unauthenticated state)
  // DO NOT use useEffect / async here
  // React rendering loop
  // -> render the component without currentUser
  // -> run useEffect
  // -> redraw component with currentUser
  if (currentUser !== undefined) {
    apolloClient.writeQuery({
      query: CurrentUserDocument,
      data: {
        currentUser,
      },
    });
  }
  if (handlingData && props.handlingVariables) {
    apolloClient.writeQuery({
      query: HandlingDataDocument,
      data: handlingData,
      variables: props.handlingVariables,
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
              {isBackendError ? (
                <ErrorContainer
                  statusCode={503}
                  feedbackUrl={envConfig.feedbackUrl}
                  imgSrc={`${PUBLIC_URL}/images/503-error.png`}
                />
              ) : (
                <Component {...pageProps} />
              )}
            </PageWrapper>
            <ErrorTrigger enabled={envConfig.isErrorTriggerEnabled} />
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
  // True when the server could not get the current user from the backend
  isBackendError: boolean;
  // undefined when getInitialProps runs in the browser, so the cached user is kept
  currentUser: CurrentUserQuery["currentUser"] | undefined;
  handlingData: HandlingDataQuery | null;
  handlingVariables: HandlingDataQueryVariables | null;
  notificationsData: ShowNotificationsListQuery | null;
  envConfig: StaffEnvConfig;
};

// Override the data fetching for the whole app
// this is done because we need currentUser and ACL list on every page
// NOTE this is not recommended but the alternative is to migrate to app router
// it disables automatic static page generation (we don't care) but might disable other optimizations
MyApp.getInitialProps = async (context: AppContext): Promise<AppOwnProps & AppInitialProps> => {
  const ctx = await App.getInitialProps(context);

  // Next.js runs this in the browser on client navigation to a page without getServerSideProps.
  // Server env is empty in the browser, so reuse the env of the first server render.
  // The Apollo cache already has the user and navigation data, so do not query them again.
  if (typeof window !== "undefined") {
    return {
      ...ctx,
      envConfig: window.__NEXT_DATA__.props.envConfig,
      isBackendError: false,
      currentUser: undefined,
      handlingData: null,
      handlingVariables: null,
      notificationsData: null,
    };
  }

  const commonProps = await getCommonServerSideProps();
  triggerServerError(commonProps.isErrorTriggerEnabled, context.ctx);

  // The proxy shows 503 when the backend is down, so do not query it
  if (context.router.pathname === "/503") {
    return {
      ...ctx,
      envConfig: commonProps,
      isBackendError: false,
      currentUser: null,
      handlingData: null,
      handlingVariables: null,
      notificationsData: null,
    };
  }

  const client = createClient(commonProps.apiBaseUrl, context.ctx.req);
  const startTime = performance.now();
  const handlingVariables = getHandlingDataVariables();

  // The Navigation component needs all of this data, otherwise it flashes.
  // Only the user is required. If an other query fails, the page shows without that data.
  const [userResult, handlingResult, notificationsResult] = await Promise.allSettled([
    client.query<CurrentUserQuery, CurrentUserQueryVariables>({
      query: CurrentUserDocument,
    }),
    client.query<HandlingDataQuery, HandlingDataQueryVariables>({
      query: HandlingDataDocument,
      variables: handlingVariables,
    }),
    client.query<ShowNotificationsListQuery, ShowNotificationsListQueryVariables>({
      query: ShowNotificationsListDocument,
      variables: {
        target: BannerNotificationTarget.Staff,
      },
    }),
  ]);
  logGraphQLQuery(performance.now() - startTime, formatUrlPath(context.router), [
    CurrentUserDocument,
    HandlingDataDocument,
    ShowNotificationsListDocument,
  ]);

  for (const result of [userResult, handlingResult, notificationsResult]) {
    // The error link already logged the errors of the backend requests
    if (result.status === "rejected" && !isRequestError(result.reason)) {
      logError(result.reason);
    }
  }

  // Without the user the page shows the sign in page, also to a user who is logged in.
  // So show the error page.
  if (userResult.status === "rejected") {
    if (context.ctx.res != null) {
      context.ctx.res.statusCode = 503;
    }
    return {
      ...ctx,
      envConfig: commonProps,
      isBackendError: true,
      currentUser: null,
      handlingData: null,
      handlingVariables: null,
      notificationsData: null,
    };
  }

  return {
    ...ctx,
    envConfig: commonProps,
    isBackendError: false,
    currentUser: userResult.value.data?.currentUser ?? null,
    handlingData: handlingResult.status === "fulfilled" ? (handlingResult.value.data ?? null) : null,
    handlingVariables,
    notificationsData: notificationsResult.status === "fulfilled" ? (notificationsResult.value.data ?? null) : null,
  };
};

// NOTE inferred type problem so casting to FC
export default appWithTranslation(MyApp) as FC;
