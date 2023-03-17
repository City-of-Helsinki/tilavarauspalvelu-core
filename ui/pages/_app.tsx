import React, { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { appWithTranslation, UserConfig } from "next-i18next";
import type { AppProps } from "next/app";
import { fi } from "date-fns/locale";
import { SessionProvider, signOut } from "next-auth/react";
import { format, isValid } from "date-fns";
import { ThemeProvider } from "styled-components";
import { theme } from "common";
import PageWrapper from "../components/common/PageWrapper";
import ExternalScripts from "../components/ExternalScripts";
import { DataContextProvider } from "../context/DataContext";
import apolloClient from "../modules/apolloClient";
import {
  authenticationApiRoute,
  authenticationLogoutApiRoute,
  isBrowser,
  mockRequests,
} from "../modules/const";
import { TrackingWrapper } from "../modules/tracking";
import nextI18NextConfig from "../next-i18next.config";
import "../styles/global.scss";
import { initMocks } from "../mocks";
import { useLogout } from "../hooks/useLogout";

if (mockRequests) {
  initMocks();
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const MyApp = ({ Component, pageProps }: AppProps) => {
  const { shouldLogout, removeShouldLogout } = useLogout();

  const [showChild, setShowChild] = useState(false);

  useEffect(() => {
    if (shouldLogout) {
      removeShouldLogout();
      signOut({ redirect: true, callbackUrl: authenticationLogoutApiRoute });
    } else {
      setShowChild(true);
    }
  }, [removeShouldLogout, shouldLogout, showChild]);

  if (!showChild || shouldLogout) {
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
          <SessionProvider
            session={pageProps.session}
            basePath={authenticationApiRoute}
          >
            <ApolloProvider client={apolloClient}>
              <ThemeProvider theme={theme}>
                <PageWrapper {...pageProps}>
                  <Component {...pageProps} />
                </PageWrapper>
              </ThemeProvider>
            </ApolloProvider>
          </SessionProvider>
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
