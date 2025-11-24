import React, { useEffect, useState } from "react";
import type { FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { CookieBanner, CookieConsentContextProvider } from "hds-react";
import { appWithTranslation, useTranslation } from "next-i18next";
import App from "next/app";
import type { AppContext, AppInitialProps, AppProps } from "next/app";
import { ToastContainer } from "ui/src/components/toast";
import "ui/src/styles/global.scss";
import { getLocalizationLang } from "@ui/modules/helpers";
import { ExternalScripts } from "@/components/ExternalScripts";
import { PageWrapper } from "@/components/PageWrapper";
import { EnvContextProvider } from "@/context/EnvContext";
import { createApolloClient } from "@/modules/apolloClient";
import { ANALYTICS_COOKIE_GROUP_NAME, isBrowser } from "@/modules/const";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import type { CustomerEnvConfig } from "@/modules/serverUtils";
import { TrackingWrapper } from "@/modules/tracking";
import { updateSentryConfig } from "../../instrumentation-client";
import "../styles/global.scss";
import sitesettings from "./sitesettings.json";

// suppress useLayoutEffect warnings on SSR till it's fixed upstream in HDS
if (typeof window === "undefined") React.useLayoutEffect = () => {};

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

function MyApp<T>(props: AppProps<T> & AppOwnProps): React.ReactElement {
  const { Component, envConfig, pageProps } = props;
  const { hotjarEnabled, matomoEnabled, apiBaseUrl, sentryDsn, sentryEnvironment } = envConfig;
  useEffect(() => {
    if (sentryDsn) {
      updateSentryConfig(sentryDsn, sentryEnvironment);
    }
  }, [sentryDsn, sentryEnvironment]);

  const { i18n } = useTranslation();
  const { hasUserAcceptedStatistics: statisticsAccepted, recheck } = useHasUserAcceptedStatistics();

  const client = createApolloClient(apiBaseUrl ?? "", undefined);
  const language = getLocalizationLang(i18n.language);

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
        <EnvContextProvider env={envConfig}>
          <ApolloProvider client={client}>
            <PageWrapper
              apiBaseUrl={apiBaseUrl}
              profileLink={envConfig.profileLink}
              feedbackUrl={envConfig.feedbackUrl}
              version={envConfig.version}
            >
              <Component {...pageProps} />
              <CookieBanner />
            </PageWrapper>
            <ToastContainer />
          </ApolloProvider>
        </EnvContextProvider>
      </TrackingWrapper>
      <ExternalScripts enableMatomo={enableMatomo} enableHotjar={enableHotjar} />
    </CookieConsentContextProvider>
  );
}

type AppOwnProps = {
  envConfig: CustomerEnvConfig;
};
MyApp.getInitialProps = async (context: AppContext): Promise<AppOwnProps & AppInitialProps> => {
  const ctx = await App.getInitialProps(context);
  const commonProps = getCommonServerSideProps();
  return { ...ctx, envConfig: commonProps };
};

// NOTE infered type problem so casting to FC
export default appWithTranslation(MyApp) as FC;
