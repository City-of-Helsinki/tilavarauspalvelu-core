import React, { useEffect } from "react";
import type { AppProps } from "next/app";
import "common/styles/global.scss";
import "../styles/global.scss";
import { ApolloProvider } from "@apollo/client";
import { createClient } from "@/common/apolloClient";
import { updateSentryConfig } from "../../sentry.client.config";
import { PageProps } from ".";

export default function App({ Component, pageProps }: AppProps<PageProps>) {
  const { apiBaseUrl, sentryDsn, sentryEnvironment } = pageProps;
  useEffect(() => {
    if (sentryDsn) {
      updateSentryConfig(sentryDsn, sentryEnvironment);
    }
  }, [sentryDsn, sentryEnvironment]);

  const apolloClient = createClient(apiBaseUrl ?? "");
  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
