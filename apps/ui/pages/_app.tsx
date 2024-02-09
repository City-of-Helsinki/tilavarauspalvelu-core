import React, { type FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { appWithTranslation } from "next-i18next";
import type { AppProps } from "next/app";
/* eslint-disable import/no-duplicates */
import { fi } from "date-fns/locale";
import { format, isValid } from "date-fns";
/* eslint-enable import/no-duplicates */
import { ThemeProvider } from "styled-components";
import { theme } from "common";
import PageWrapper from "../components/common/PageWrapper";
import { ExternalScripts } from "../components/ExternalScripts";
import { DataContextProvider } from "../context/DataContext";
import { createApolloClient } from "../modules/apolloClient";
import { TrackingWrapper } from "../modules/tracking";
import nextI18NextConfig from "../next-i18next.config";
import "common/styles/variables.css";
import "../styles/global.scss";

const MyApp = ({ Component, pageProps }: AppProps) => {
  const { hotjarEnabled, matomoEnabled, cookiehubEnabled, apiBaseUrl } =
    pageProps;
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
};

// NOTE functions are not serializable so we have to overload them here (instead of the js config)
// NOTE infered type problem so casting to FC
export default appWithTranslation(MyApp, {
  ...nextI18NextConfig,
  interpolation: {
    format: (value, fmt, _lng) => {
      if (value instanceof Date && isValid(value))
        return format(value, fmt || "d.M.yyyy", { locale: fi });
      return value;
    },
    escapeValue: false,
  },
}) as FC;
