import React, { useEffect, type FC } from "react";
import App, { type AppContext, type AppInitialProps, type AppProps } from "next/app";
import "common/styles/global.scss";
import "../styles/global.scss";
import { ApolloProvider } from "@apollo/client";
import { createClient } from "@/common/apolloClient";
import { updateSentryConfig } from "../../instrumentation-client";
import { type PageProps } from ".";
import { appWithTranslation } from "next-i18next";
import Layout from "./layout";
import PageWrapper from "@/component/PageWrapper";
import { ModalContextProvider } from "@/context/ModalContext";
import {
  BannerNotificationTarget,
  CurrentUserDocument,
  type CurrentUserQuery,
  type CurrentUserQueryVariables,
  HandlingDataDocument,
  type HandlingDataQuery,
  type HandlingDataQueryVariables,
  ReservationStateChoice,
  ShowNotificationsListDocument,
  type ShowNotificationsListQuery,
  type ShowNotificationsListQueryVariables,
} from "@gql/gql-types";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { toApiDate } from "common/src/date-utils";

function MyApp(props: AppProps<PageProps> & AppOwnProps): JSX.Element {
  const { Component, pageProps, currentUser, handlingData, notificationsData } = props;
  const { apiBaseUrl, sentryDsn, sentryEnvironment, version } = pageProps;
  useEffect(() => {
    if (sentryDsn) {
      updateSentryConfig(sentryDsn, sentryEnvironment);
    }
  }, [sentryDsn, sentryEnvironment]);

  // NOTE incorrectly typed (apiBaseUrl can be undefined during build)
  const apolloClient = createClient(apiBaseUrl ?? "");

  // Manual rehydration of currentUser (otherwise we have flashes of unauthenticated state)
  // DO NOT use useEffect / async here
  // React rendering loop
  // -> render component
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
      <ModalContextProvider>
        <Layout version={version}>
          <PageWrapper apiBaseUrl={apiBaseUrl}>
            <Component {...pageProps} />
          </PageWrapper>
        </Layout>
      </ModalContextProvider>
    </ApolloProvider>
  );
}

type AppOwnProps = {
  currentUser: CurrentUserQuery["currentUser"];
  handlingData: HandlingDataQuery | null;
  notificationsData: ShowNotificationsListQuery | null;
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
    const { data } = await client.query<CurrentUserQuery, CurrentUserQueryVariables>({
      query: CurrentUserDocument,
      fetchPolicy: "no-cache",
    });
    // Need to fetch all data required by the Navigation component otherwise it flashes
    const { data: handlingData } = await client.query<HandlingDataQuery, HandlingDataQueryVariables>({
      query: HandlingDataDocument,
      fetchPolicy: "no-cache",
      variables: {
        beginDate: toApiDate(new Date()) ?? "",
        state: ReservationStateChoice.RequiresHandling,
      },
    });
    const { data: notificationsData } = await client.query<
      ShowNotificationsListQuery,
      ShowNotificationsListQueryVariables
    >({
      query: ShowNotificationsListDocument,
      fetchPolicy: "no-cache",
      variables: {
        target: BannerNotificationTarget.Staff,
      },
    });

    return { ...ctx, currentUser: data.currentUser, handlingData, notificationsData: notificationsData };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching current user:", error);
  }

  return { ...ctx, currentUser: null, handlingData: null, notificationsData: null };
};

// NOTE inferred type problem so casting to FC
export default appWithTranslation(MyApp) as FC;
