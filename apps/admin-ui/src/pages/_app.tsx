import React from "react";
import type { AppProps } from "next/app";
import "hds-core/lib/base.css";
import "common/styles/variables.css";
import "../index.scss";
import { ApolloProvider } from "@apollo/client";
import { createClient } from "@/common/apolloClient";

export default function App({ Component, pageProps }: AppProps) {
  // TODO fix typing (type the AppProps)
  const { apiBaseUrl } = pageProps;
  const apolloClient = createClient(apiBaseUrl ?? "");
  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}
