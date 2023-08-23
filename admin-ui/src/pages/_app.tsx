// `pages/_app.js`
import React from "react";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

import "hds-core/lib/base.css";
import "../index.scss";
import { nextAuthRoute, isBrowser } from "app/common/const";
import { ApolloProvider } from "@apollo/client";
import apolloClient from "app/common/apolloClient";
import ExternalScripts from "../common/ExternalScripts";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <SessionProvider session={pageProps.session} basePath={nextAuthRoute}>
        <ApolloProvider client={apolloClient}>
          <Component {...pageProps} />
        </ApolloProvider>
      </SessionProvider>
      {isBrowser && <ExternalScripts />}
    </>
  );
}
