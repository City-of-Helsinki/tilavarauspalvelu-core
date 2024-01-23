import React from "react";
import type { AppProps } from "next/app";
import "hds-core/lib/base.css";
import "../index.scss";
import { ApolloProvider } from "@apollo/client";
import apolloClient from "@/common/apolloClient";
import { ExternalScripts } from "@/common/ExternalScripts";

export default function App({ Component, pageProps }: AppProps) {
  const { hotjarEnabled, cookiehubEnabled } = pageProps;
  return (
    <>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
      </ApolloProvider>
      <ExternalScripts
        isCookiehubEnabled={cookiehubEnabled ?? false}
        isHotjarEnabled={hotjarEnabled ?? false}
      />
    </>
  );
}
