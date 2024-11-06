import React, { useEffect, type FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { appWithTranslation } from "next-i18next";
import type { AppProps } from "next/app";
import { ThemeProvider } from "styled-components";
import { theme } from "common";
import PageWrapper from "../components/common/PageWrapper";
import { ExternalScripts } from "@/components/ExternalScripts";
import { DataContextProvider } from "@/context/DataContext";
import { createApolloClient } from "@/modules/apolloClient";
import { TrackingWrapper } from "@/modules/tracking";
import "common/styles/global.scss";
import "../styles/global.scss";
import { updateSentryConfig } from "@/sentry.client.config";
import { ToastContainer } from "common/src/common/toast";

function MyApp({ Component, pageProps }: AppProps) {
  const {
    hotjarEnabled,
    matomoEnabled,
    cookiehubEnabled,
    apiBaseUrl,
    sentryDsn,
    sentryEnvironment,
  } = pageProps;
  useEffect(() => {
    if (sentryDsn) {
      updateSentryConfig(sentryDsn, sentryEnvironment);
    }
  }, [sentryDsn, sentryEnvironment]);

  const client = createApolloClient(apiBaseUrl ?? "", undefined);

  return (
    <>
      <DataContextProvider>
        <TrackingWrapper matomoEnabled={matomoEnabled}>
          {/* TODO is this ever called on the server? then the ctx is not undefined */}
          <ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
              <PageWrapper {...pageProps}>
                <Component {...pageProps} />
              </PageWrapper>
              <ToastContainer />
            </ThemeProvider>
          </ApolloProvider>
        </TrackingWrapper>
      </DataContextProvider>
      <ExternalScripts
        cookiehubEnabled={cookiehubEnabled}
        matomoEnabled={matomoEnabled}
        hotjarEnabled={hotjarEnabled}
      />
    </>
  );
}

// NOTE infered type problem so casting to FC
export default appWithTranslation(MyApp) as FC;
