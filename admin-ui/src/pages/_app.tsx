// `pages/_app.js`
import React from "react";
import type { AppProps } from "next/app";
import { SessionProvider, signOut } from "next-auth/react";
import "../index.scss";
import { apiBaseUrl } from "app/common/const";
import { ApolloProvider } from "@apollo/client";
import apolloClient from "app/common/apolloClient";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session} basePath={apiBaseUrl}>
      <ApolloProvider client={apolloClient}>
        <Component {...pageProps} />
      </ApolloProvider>
    </SessionProvider>
  );
}
