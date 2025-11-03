import React, { useEffect, useState, type FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { CookieBanner, CookieConsentContextProvider } from "hds-react";
import { appWithTranslation, useTranslation } from "next-i18next";
import type { AppProps } from "next/app";
import { ToastContainer } from "ui/src/components/toast";
import { convertLanguageCode } from "ui/src/modules/util";
import "ui/src/styles/global.scss";
import { ExternalScripts } from "@/components/ExternalScripts";
import { PageWrapper } from "@/components/PageWrapper";
import { createApolloClient } from "@/modules/apolloClient";
import { ANALYTICS_COOKIE_GROUP_NAME, isBrowser } from "@/modules/const";
import { TrackingWrapper } from "@/modules/tracking";
import { updateSentryConfig } from "../../instrumentation-client";
import "../styles/global.scss";
import sitesettings from "./sitesettings.json";

/// check if the user has accepted the statistics cookies
/// only client side
/// the HDS version of this hook doesn't work
function hasUserAcceptedStatistics(): boolean {
  if (!isBrowser) {
    return false;
  }
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
  const consentCookie = cookies.find((cookie) => cookie.startsWith("varaamo-cookie-consents="));
  if (consentCookie) {
    const val = consentCookie.split("=")[1];
    if (val == null) {
      return false;
    }
    const des = decodeURIComponent(val);
    const parsed = JSON.parse(des);
    if (parsed) {
      return parsed.groups[ANALYTICS_COOKIE_GROUP_NAME] != null;
    }
  }
  return false;
}

// hook wrap so we can recheck the cookie as a side effect
function useHasUserAcceptedStatistics() {
  const [analyticsAccepted, setAnalyticsAccepted] = useState(false);
  useEffect(() => {
    setAnalyticsAccepted(hasUserAcceptedStatistics());
  }, [setAnalyticsAccepted]);
  return {
    hasUserAcceptedStatistics: analyticsAccepted,
    recheck: () => setAnalyticsAccepted(hasUserAcceptedStatistics()),
  };
}

function MyApp({ Component, pageProps }: AppProps) {
  const { hotjarEnabled, matomoEnabled, apiBaseUrl, sentryDsn, sentryEnvironment } = pageProps;
  useEffect(() => {
    if (sentryDsn) {
      updateSentryConfig(sentryDsn, sentryEnvironment);
    }
  }, [sentryDsn, sentryEnvironment]);

  const { i18n } = useTranslation();
  const { hasUserAcceptedStatistics: statisticsAccepted, recheck } = useHasUserAcceptedStatistics();

  const client = createApolloClient(apiBaseUrl ?? "", undefined);
  const language = convertLanguageCode(i18n.language);

  const enableMatomo = matomoEnabled && statisticsAccepted;
  const enableHotjar = hotjarEnabled && statisticsAccepted;

  return (
    <CookieConsentContextProvider
      siteSettings={sitesettings}
      options={{
        language,
      }}
      onChange={recheck}
    >
      <TrackingWrapper matomoEnabled={enableMatomo}>
        {/* TODO is this ever called on the server? then the ctx is not undefined */}
        <ApolloProvider client={client}>
          <PageWrapper {...pageProps}>
            <Component {...pageProps} />
            <CookieBanner />
          </PageWrapper>
          <ToastContainer />
        </ApolloProvider>
      </TrackingWrapper>
      <ExternalScripts enableMatomo={enableMatomo} enableHotjar={enableHotjar} />
    </CookieConsentContextProvider>
  );
}

// NOTE infered type problem so casting to FC
export default appWithTranslation(MyApp) as FC;
