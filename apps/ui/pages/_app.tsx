import React, { useEffect, useState, type FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { appWithTranslation, useTranslation } from "next-i18next";
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
import {
  CookieBanner,
  CookieConsentChangeEvent,
  CookieConsentContextProvider,
  useGroupConsent,
} from "hds-react";
import sitesettings from "./sitesettings.json";
import { convertLanguageCode } from "common/src/common/util";
import { ANALYTICS_COOKIE_GROUP_NAME } from "@/modules/const";

function MyApp({ Component, pageProps }: AppProps) {
  const {
    hotjarEnabled,
    matomoEnabled,
    apiBaseUrl,
    sentryDsn,
    sentryEnvironment,
  } = pageProps;
  useEffect(() => {
    if (sentryDsn) {
      updateSentryConfig(sentryDsn, sentryEnvironment);
    }
  }, [sentryDsn, sentryEnvironment]);

  const { i18n } = useTranslation();

  const statsEnabled = useGroupConsent(ANALYTICS_COOKIE_GROUP_NAME);
  const [isStatisticsAccepted, setIsStatisticsAccepted] =
    useState(statsEnabled);

  const cookieSelectionChange = (evt: CookieConsentChangeEvent) => {
    const statsAccepted = evt.acceptedGroups.find(
      (group) => group === ANALYTICS_COOKIE_GROUP_NAME
    );
    if (statsAccepted) {
      setIsStatisticsAccepted(true);
    } else {
      setIsStatisticsAccepted(false);
    }
  };

  const client = createApolloClient(apiBaseUrl ?? "", undefined);
  const language = convertLanguageCode(i18n.language);

  const enableMatomo = matomoEnabled && isStatisticsAccepted;
  const enableHotjar = hotjarEnabled && isStatisticsAccepted;

  return (
    <DataContextProvider>
      <CookieConsentContextProvider
        siteSettings={sitesettings}
        options={{
          language,
        }}
        onChange={cookieSelectionChange}
      >
        <TrackingWrapper matomoEnabled={enableMatomo}>
          {/* TODO is this ever called on the server? then the ctx is not undefined */}
          <ApolloProvider client={client}>
            <ThemeProvider theme={theme}>
              <PageWrapper {...pageProps}>
                <Component {...pageProps} />
                <CookieBanner />
              </PageWrapper>
              <ToastContainer />
            </ThemeProvider>
          </ApolloProvider>
        </TrackingWrapper>
        <ExternalScripts
          enableMatomo={enableMatomo}
          enableHotjar={enableHotjar}
        />
      </CookieConsentContextProvider>
    </DataContextProvider>
  );
}

// NOTE infered type problem so casting to FC
export default appWithTranslation(MyApp) as FC;
