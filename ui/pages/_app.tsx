import React, { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { appWithTranslation, UserConfig } from "next-i18next";
import { fi } from "date-fns/locale";
import { format, isValid } from "date-fns";

import { OidcProvider } from "@axa-fr/react-oidc-context";
import { AppProps } from "next/app";
import PageWrapper from "../components/common/PageWrapper";

import ExternalScripts from "../components/ExternalScripts";
import { DataContextProvider } from "../context/DataContext";
import apolloClient from "../modules/apolloClient";
import oidcConfiguration from "../modules/auth/configuration";
import { isBrowser, mockRequests } from "../modules/const";
import { TrackingWrapper } from "../modules/tracking";
import nextI18NextConfig from "../next-i18next.config";
import "../styles/global.scss";
import LoggingIn from "../components/common/LoggingIn";

import { FullscreenSpinner } from "../components/common/FullscreenSpinner";
import SessionLost from "../components/common/SessionLost";

if (mockRequests) {
  require("../mocks");
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const MyApp = ({ Component, pageProps }: AppProps) => {
  const [showChild, setShowChild] = useState(false);

  useEffect(() => {
    setShowChild(true);
  }, []);

  if (!showChild) {
    return null;
  }

  if (!isBrowser) {
    return (
      <DataContextProvider>
        <ApolloProvider client={apolloClient}>
          <PageWrapper>
            <Component {...pageProps} />
          </PageWrapper>
        </ApolloProvider>
      </DataContextProvider>
    );
  }

  return (
    <>
      <DataContextProvider>
        <TrackingWrapper>
          <OidcProvider
            configuration={oidcConfiguration}
            callbackSuccessComponent={LoggingIn}
            loadingComponent={FullscreenSpinner}
            authenticatingComponent={FullscreenSpinner}
            sessionLostComponent={SessionLost}
          >
            <ApolloProvider client={apolloClient}>
              <PageWrapper {...pageProps}>
                <Component {...pageProps} />
              </PageWrapper>
            </ApolloProvider>
          </OidcProvider>
        </TrackingWrapper>
      </DataContextProvider>
      <ExternalScripts />
    </>
  );
};

export default appWithTranslation(MyApp, {
  ...(nextI18NextConfig as UserConfig),
  interpolation: {
    format: (value, fmt, lng) => {
      const locales = { fi };
      if (value instanceof Date && isValid(value))
        return format(value, fmt || "d.M.yyyy", { locale: locales[lng] });
      return value;
    },
    escapeValue: false,
  },
});
